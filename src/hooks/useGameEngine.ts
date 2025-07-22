
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameState } from '@/types/game';
import { FruitKey, FRUITS } from '@/components/fruits';

const GAME_STATE_DOC_ID = 'main_game';
const ROUND_DURATION = 20;
const SPIN_DURATION = 5000; // 5 seconds for spinning animation

const ALL_FRUITS: FruitKey[] = Object.keys(FRUITS) as FruitKey[];
const SPIN_SEQUENCE: FruitKey[] = ['lemon', 'orange', 'cherry', 'watermelon', 'pear', 'strawberry', 'apple', 'grapes'];

export function useGameEngine(balance: number, setBalance: (balance: number | ((prev: number) => number)) => void) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [highlightedFruit, setHighlightedFruit] = useState<FruitKey | null>(null);

  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMasterClient = useRef(false);
  const lastUpdateRef = useRef(0);

  // Initialize and subscribe to game state
  useEffect(() => {
    const docRef = doc(db, 'game', GAME_STATE_DOC_ID);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameState;
        setGameState(data);
        lastUpdateRef.current = data.lastUpdated || 0;
      } else {
        // If doc doesn't exist, this client will try to initialize it
        initializeGameState();
      }
    });

    const initializeGameState = async () => {
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    const initialGameState: GameState = {
                        id: GAME_STATE_DOC_ID,
                        timer: ROUND_DURATION,
                        isSpinning: false,
                        winningFruit: null,
                        history: Array.from({ length: 5 }, () => ALL_FRUITS[Math.floor(Math.random() * ALL_FRUITS.length)]),
                        bets: {} as Record<FruitKey, number>,
                        lastUpdated: Date.now(),
                    };
                    transaction.set(docRef, initialGameState);
                    isMasterClient.current = true; // The one who initializes becomes master
                }
            });
        } catch (error) {
            console.error("Failed to initialize game state:", error);
        }
    };
    
    // Check for master client status
    const masterCheckInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 5000) { // If no update for 5s, take over
             isMasterClient.current = true;
        } else {
             isMasterClient.current = false;
        }
    }, 6000);

    return () => {
      unsubscribe();
      clearInterval(masterCheckInterval);
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, []);

  // Main Game Loop Logic (runs only on master client)
  useEffect(() => {
    if (!isMasterClient.current || !gameState || !gameState.id) return;

    if (localTimerRef.current) clearInterval(localTimerRef.current);

    if (!gameState.isSpinning) {
      localTimerRef.current = setInterval(async () => {
        const docRef = doc(db, 'game', GAME_STATE_DOC_ID);
        try {
            await runTransaction(db, async (transaction) => {
                const freshGameState = await transaction.get(docRef);
                if (!freshGameState.exists()) throw "Document does not exist!";
                
                const currentTimer = freshGameState.data().timer;

                if (currentTimer > 0) {
                    transaction.update(docRef, { timer: currentTimer - 1, lastUpdated: Date.now() });
                } else {
                    // Timer reached 0, start the spin
                    const winner = ALL_FRUITS[Math.floor(Math.random() * ALL_FRUITS.length)];
                    transaction.update(docRef, { isSpinning: true, winningFruit: winner, timer: 0, lastUpdated: Date.now() });
                }
            });
        } catch (e) {
            console.error("Timer update transaction failed: ", e);
        }
      }, 1000);
    } else { // Is spinning
       const finishTime = gameState.lastUpdated + SPIN_DURATION;
       const timeoutId = setTimeout(async () => {
           // This runs after spin is complete
           const docRef = doc(db, 'game', GAME_STATE_DOC_ID);
           try {
               await runTransaction(db, async (transaction) => {
                   const freshGameStateSnap = await transaction.get(docRef);
                   if (!freshGameStateSnap.exists()) return;
                   const freshGameState = freshGameStateSnap.data() as GameState;

                   // Payouts should be calculated server-side for security, but we do it here for proto
                   // In a real app, a Cloud Function would handle payouts based on the 'bets' object.
                   
                   // Reset for next round
                   transaction.update(docRef, {
                       isSpinning: false,
                       winningFruit: null,
                       history: [freshGameState.winningFruit!, ...freshGameState.history.slice(0, 4)],
                       bets: {},
                       timer: ROUND_DURATION,
                       lastUpdated: Date.now()
                   });
               });
           } catch (error) {
               console.error("End of round transaction failed: ", error);
           }

       }, Math.max(0, finishTime - Date.now()));
       
       return () => clearTimeout(timeoutId);
    }

    return () => {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [isMasterClient.current, gameState?.isSpinning, gameState?.id]);

  // Spinning Animation Logic (runs on all clients)
  useEffect(() => {
    if (gameState?.isSpinning && gameState.winningFruit) {
        let spinSequence = [...SPIN_SEQUENCE];
        const winnerIndexInSequence = spinSequence.indexOf(gameState.winningFruit);
        
        if (winnerIndexInSequence === -1) {
            spinSequence.push(gameState.winningFruit);
        }
      
        const totalSteps = (3 * spinSequence.length) + spinSequence.indexOf(gameState.winningFruit);

        const spinAnimationSequence = Array.from(
            { length: totalSteps + 1 },
            (_, i) => spinSequence[i % spinSequence.length]
        );
      
        let spinIndex = 0;
        const spinInterval = setInterval(() => {
            if(spinIndex < spinAnimationSequence.length) {
                setHighlightedFruit(spinAnimationSequence[spinIndex]);
                spinIndex++;
            } else {
                clearInterval(spinInterval);
                setHighlightedFruit(gameState.winningFruit); // Land on winner
                
                // Payout logic
                const bets = gameState.bets || {};
                const userBetsOnWinner = bets[gameState.winningFruit!] || 0;

                if (userBetsOnWinner > 0) {
                    const payout = userBetsOnWinner * FRUITS[gameState.winningFruit!].multiplier;
                    setBalance(prev => prev + payout);
                }

                setTimeout(() => {
                  setHighlightedFruit(null);
                }, 1000); 
            }
        }, 150); 

        return () => clearInterval(spinInterval);
    } else {
        setHighlightedFruit(null);
    }
  }, [gameState?.isSpinning, gameState?.winningFruit, gameState?.bets, setBalance]);

  const placeBet = useCallback(async (fruit: FruitKey, amount: number) => {
    if (gameState && !gameState.isSpinning && gameState.timer > 3 && balance >= amount) {
      const docRef = doc(db, 'game', GAME_STATE_DOC_ID);
      
      setBalance(prev => prev - amount);
      
      try {
        await updateDoc(docRef, {
          [`bets.${fruit}`]: increment(amount)
        });
      } catch (error) {
        console.error("Failed to place bet: ", error);
        // Revert balance if firestore update fails
        setBalance(prev => prev + amount);
      }
    }
  }, [gameState, balance, setBalance]);

  return { gameState, placeBet, highlightedFruit };
}
