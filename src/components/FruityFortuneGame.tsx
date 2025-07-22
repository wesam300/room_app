
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

const BET_AMOUNTS = [100000, 500000, 1000000, 5000000, 10000000];
const ROUND_DURATION = 20; // seconds
const SPIN_DURATION = 4; // seconds
const TOTAL_DURATION = ROUND_DURATION + SPIN_DURATION;
const DAILY_REWARD_AMOUNT = 10000000;
const MAX_BET_SLOTS = 6;

const FRUIT_KEYS = Object.keys(FRUITS) as FruitKey[];

// This defines the grid layout.
const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'orange', 'cherry', 'watermelon',
    'lemon', 'timer', 'pear',
    'grapes', 'apple', 'strawberry'
];

// This defines the visual, clockwise path for the spinning animation.
const VISUAL_SPIN_ORDER: FruitKey[] = [
    'orange', 'cherry', 'watermelon', 'pear', 'strawberry', 'apple', 'grapes', 'lemon'
];

// --- New Probability-based Winner Generation ---

// 1. Define the probability matrix based on the user's table
const PROBABILITY_MATRIX = [
  // Level 0: 0 rounds since big win
  { 5: 0.70, 10: 0.08, 15: 0.04, 25: 0.002, 45: 0 },
  // Level 1: 1 round
  { 5: 0.60, 10: 0.12, 15: 0.06, 25: 0.005, 45: 0.001 },
  // Level 2: 2 rounds
  { 5: 0.55, 10: 0.15, 15: 0.08, 25: 0.01, 45: 0.002 },
  // Level 3: 3 rounds
  { 5: 0.50, 10: 0.18, 15: 0.10, 25: 0.015, 45: 0.003 },
  // Level 4: 4 rounds
  { 5: 0.45, 10: 0.20, 15: 0.12, 25: 0.02, 45: 0.005 },
  // Level 5: 5+ rounds
  { 5: 0.40, 10: 0.22, 15: 0.14, 25: 0.03, 45: 0.01 },
];

// 2. Group fruits by their multiplier
const FRUITS_BY_MULTIPLIER: Record<number, FruitKey[]> = {
    5: [], 10: [], 15: [], 25: [], 45: []
};
for (const key in FRUITS) {
    const fruitKey = key as FruitKey;
    const fruit = FRUITS[fruitKey];
    if (FRUITS_BY_MULTIPLIER[fruit.multiplier]) {
        FRUITS_BY_MULTIPLIER[fruit.multiplier].push(fruitKey);
    }
}


// --- Cached Calculations for Deterministic Results ---
// This avoids re-calculating the entire history on every render.
const deterministicWinnerCache = new Map<number, { winner: FruitKey, isBigWin: boolean }>();

function getWinnerForRound(roundId: number): { winner: FruitKey, isBigWin: boolean } {
    if (deterministicWinnerCache.has(roundId)) {
        return deterministicWinnerCache.get(roundId)!;
    }

    // A pseudo-random but deterministic seed for this round
    let seed = roundId;
    const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    // --- Special Event Logic ---
    const displayRoundId = (roundId % 1000);
    // Every 20 rounds, guarantee a medium win (overrides the 10-round rule)
    if (roundId > 0 && displayRoundId > 0 && displayRoundId % 20 === 0) {
        const mediumWinFruits = [...FRUITS_BY_MULTIPLIER[10], ...FRUITS_BY_MULTIPLIER[15]];
        const winner = mediumWinFruits[Math.floor(pseudoRandom() * mediumWinFruits.length)];
        const result = { winner, isBigWin: true };
        deterministicWinnerCache.set(roundId, result);
        return result;
    }

    // Every 10 rounds, a low-tier fruit wins (simulates "lowest bet wins")
    if (roundId > 0 && displayRoundId > 0 && displayRoundId % 10 === 0) {
         const lowestTierFruits = FRUITS_BY_MULTIPLIER[5];
         const winner = lowestTierFruits[Math.floor(pseudoRandom() * lowestTierFruits.length)];
         const result = { winner, isBigWin: false }; // 5x is not a big win
         deterministicWinnerCache.set(roundId, result);
         return result;
    }


    // --- Standard Probability Logic ---
    let roundsSinceBigWin = 0;
    // To calculate roundsSinceBigWin, we must check previous rounds deterministically
    let checkRound = roundId - 1;
    while(checkRound >= 0) {
        const previousRoundResult = getWinnerForRound(checkRound); // Recursive call to get historical data
        if (previousRoundResult.isBigWin) {
            break; // Found the last big win
        }
        roundsSinceBigWin++;
        checkRound--;
    }
    
    // Determine the probability level, maxing out at the last level
    const level = Math.min(roundsSinceBigWin, PROBABILITY_MATRIX.length - 1);
    const probabilities = PROBABILITY_MATRIX[level];
    
    let random = pseudoRandom();
    let winningMultiplier: number | null = null;
    
    // Select a multiplier category based on the probabilities
    for (const multiplierStr in probabilities) {
        const multiplier = parseInt(multiplierStr, 10);
        const chance = probabilities[multiplier as keyof typeof probabilities];
        if (random < chance) {
            winningMultiplier = multiplier;
            break;
        }
        random -= chance;
    }
    
    // Fallback to 5x if no category was chosen (due to floating point inaccuracies)
    if (winningMultiplier === null) {
        winningMultiplier = 5;
    }
    
    // Get all fruits with that multiplier
    const possibleWinners = FRUITS_BY_MULTIPLIER[winningMultiplier];
    if (!possibleWinners || possibleWinners.length === 0) {
         // Fallback if a multiplier has no fruits (should not happen with current config)
        const fallbackWinners = FRUITS_BY_MULTIPLIER[5];
        winningMultiplier = 5;
        const winner = fallbackWinners[Math.floor(pseudoRandom() * fallbackWinners.length)];
        const result = { winner, isBigWin: false };
        deterministicWinnerCache.set(roundId, result);
        return result;
    }
    
    // Select a random fruit from the chosen category
    const winner = possibleWinners[Math.floor(pseudoRandom() * possibleWinners.length)];
    const isBigWin = winningMultiplier > 5;
    const result = { winner, isBigWin };
    deterministicWinnerCache.set(roundId, result);
    return result;
}


function formatNumber(num: number) {
    if (num === null || num === undefined) return '0';
    if (num >= 10000000) return `${(num / 1000000).toFixed(0)}m`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}m`;
    if (num >= 10000) return `${(num / 1000).toFixed(0)}k`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}k`;
    return num.toLocaleString('en-US');
}


// A fun component for the winner screen background
const FallingCoins = () => {
    const coins = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 3}s`,
      fontSize: `${Math.random() * 1.5 + 1}rem`,
    }));
  
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {coins.map(coin => (
          <motion.div
            key={coin.id}
            className="absolute -top-10 text-yellow-400"
            style={{ left: coin.left, fontSize: coin.fontSize }}
            animate={{ top: '110%' }}
            transition={{
              duration: parseFloat(coin.animationDuration),
              delay: parseFloat(coin.animationDelay),
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            💰
          </motion.div>
        ))}
      </div>
    );
};
  

export default function FruityFortuneGame() {
  const [isClient, setIsClient] = useState(false);
  const [balance, setBalance] = useState(0);
  const [activeBet, setActiveBet] = useState(BET_AMOUNTS[0]);
  
  // Game state driven by time
  const [roundId, setRoundId] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerScreenInfo, setWinnerScreenInfo] = useState<{fruit: FruitKey, payout: number} | null>(null);

  // Daily Reward State
  const [lastClaimTimestamp, setLastClaimTimestamp] = useState<number | null>(null);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState('');
  const [canClaim, setCanClaim] = useState(false);
  
  const [history, setHistory] = useState<FruitKey[]>([]);
  const [bets, setBets] = useState<Record<FruitKey, number>>({});
  
  const { toast } = useToast();

  const animationSequenceRef = useRef<FruitKey[]>([]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [highlightPosition, setHighlightPosition] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  

  // Load state from localStorage on initial mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const now = Date.now();
    const currentRoundId = Math.floor(now / (TOTAL_DURATION * 1000));
    setRoundId(currentRoundId);

    // --- Load Balance ---
    const savedBalance = localStorage.getItem('fruityFortuneBalance');
    if (savedBalance) {
        setBalance(parseInt(savedBalance, 10));
    } else {
        setBalance(1000000000); // Set initial balance to 1 billion if nothing is saved
    }

    // --- Load Daily Reward ---
    const savedClaimTimestamp = localStorage.getItem('fruityFortuneLastClaim');
    if (savedClaimTimestamp) {
        setLastClaimTimestamp(parseInt(savedClaimTimestamp, 10));
    }
    
    // --- Load History & Sync Missed Rounds ---
    const savedHistory = localStorage.getItem('fruityFortuneHistory');
    let loadedHistory : FruitKey[] = [];
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            if(Array.isArray(parsedHistory)) {
                loadedHistory = parsedHistory;
            }
        } catch {
            // ignore parsing errors
        }
    } 

    const lastSyncedRound = parseInt(localStorage.getItem('fruityFortuneLastSyncedRound') || '0');
    
    // Sync history if the user has been away for one or more full rounds
    if (currentRoundId > lastSyncedRound && lastSyncedRound > 0) {
        const roundsToSync = [];
        // Sync up to the 5 most recent rounds missed
        for (let i = Math.max(lastSyncedRound + 1, currentRoundId - 4); i < currentRoundId; i++) {
            const { winner } = getWinnerForRound(i);
            roundsToSync.push(winner);
        }
        // Combine newly synced history with the most recent saved history
        const finalHistory = [...roundsToSync, ...loadedHistory].slice(0, 5);
        setHistory(finalHistory);
    } else if (loadedHistory.length === 0) {
        // If no history, create it from the last 5 rounds
        const initialHistory = [];
        for (let i = currentRoundId - 5; i < currentRoundId; i++) {
            if (i >= 0) {
                const { winner } = getWinnerForRound(i);
                initialHistory.push(winner);
            }
        }
        setHistory(initialHistory);
    } else {
        // Player is up to date, just load the history
        setHistory(loadedHistory.slice(0, 5));
    }
    
    localStorage.setItem('fruityFortuneLastSyncedRound', currentRoundId.toString());

    
    // --- Bets & Offline Payout Logic ---
    const savedBetsData = localStorage.getItem('fruityFortuneBets');
    if (savedBetsData) {
        try {
            const { bets: savedBets, roundId: savedRoundId } = JSON.parse(savedBetsData);
            if (savedBets && typeof savedRoundId === 'number' && savedRoundId < currentRoundId) {
                // Round is over, calculate offline winnings
                const { winner } = getWinnerForRound(savedRoundId);
                const payout = (savedBets[winner] || 0) * FRUITS[winner].multiplier;
                if (payout > 0) {
                    const newBalance = (parseInt(localStorage.getItem('fruityFortuneBalance') || '0', 10)) + payout;
                    setBalance(newBalance);
                    localStorage.setItem('fruityFortuneBalance', newBalance.toString());
                    toast({
                        title: "ربح أثناء غيابك!",
                        description: `لقد ربحت ${formatNumber(payout)}. الفائز كان ${FRUITS[winner].name}`,
                        variant: "default"
                    });
                }
                localStorage.removeItem('fruityFortuneBets');
            } else if (savedRoundId === currentRoundId) {
                // Round is still ongoing, restore bets
                setBets(savedBets);
            } else {
                 // Bets from a future or invalid round, remove them
                 localStorage.removeItem('fruityFortuneBets');
            }
        } catch(e) {
            console.error("Failed to parse saved bets:", e);
            localStorage.removeItem('fruityFortuneBets');
        }
    }
    
  }, [isClient, toast]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('fruityFortuneBalance', balance.toString());
      if (lastClaimTimestamp) {
          localStorage.setItem('fruityFortuneLastClaim', lastClaimTimestamp.toString());
      }
      if (history.length > 0) {
          localStorage.setItem('fruityFortuneHistory', JSON.stringify(history.slice(0, 50))); // Save more history
          localStorage.setItem('fruityFortuneLastSyncedRound', roundId.toString());
      }
      // Save bets along with the current round ID
      if (Object.keys(bets).length > 0) {
          localStorage.setItem('fruityFortuneBets', JSON.stringify({ bets, roundId }));
      } else {
          localStorage.removeItem('fruityFortuneBets');
      }
    }
  }, [balance, lastClaimTimestamp, bets, roundId, isClient, history]);


   // Daily Reward Timer Logic
   useEffect(() => {
    const updateClaimTimer = () => {
        const now = new Date();
        const iraqTimezoneOffset = 3 * 60; // UTC+3
        const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
        const nowIraq = new Date(nowUtc + (iraqTimezoneOffset * 60 * 1000));

        const nextClaimDate = new Date(nowIraq);
        nextClaimDate.setHours(24, 0, 0, 0); // Next day at 00:00 Iraq time

        if (lastClaimTimestamp) {
            const lastClaimDate = new Date(lastClaimTimestamp);
            const lastClaimUtc = lastClaimDate.getTime() + (lastClaimDate.getTimezoneOffset() * 60 * 1000);
            const lastClaimIraq = new Date(lastClaimUtc + (iraqTimezoneOffset * 60 * 1000));
            
            if (lastClaimIraq.getFullYear() === nowIraq.getFullYear() &&
                lastClaimIraq.getMonth() === nowIraq.getMonth() &&
                lastClaimIraq.getDate() === nowIraq.getDate()) {
                // Already claimed today
                setCanClaim(false);
                const diff = nextClaimDate.getTime() - nowIraq.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeUntilNextClaim(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                return;
            }
        }

        // Can claim now
        setCanClaim(true);
        setTimeUntilNextClaim('جاهزة للاستلام!');
    };

    updateClaimTimer();
    const interval = setInterval(updateClaimTimer, 1000);
    return () => clearInterval(interval);
}, [lastClaimTimestamp]);

const handleClaimReward = () => {
    if (canClaim) {
        setBalance(prev => prev + DAILY_REWARD_AMOUNT);
        const now = Date.now();
        setLastClaimTimestamp(now);
        setCanClaim(false);
        toast({ title: "تم استلام الجائزة!", description: `تمت إضافة ${formatNumber(DAILY_REWARD_AMOUNT)} إلى رصيدك.`, variant: "default" });
    } else {
        toast({ title: "لا يمكنك الاستلام الآن", description: "لقد استلمت جائزتك اليومية بالفعل.", variant: "destructive" });
    }
};

  
  // The main game loop, driven by a simple interval
  useEffect(() => {
    if (!isClient) return;

    const updateGameState = () => {
        if (winnerScreenInfo) {
            // Pause game updates while winner screen is shown
            return;
        }

        const now = Date.now();
        const currentRoundId = Math.floor(now / (TOTAL_DURATION * 1000));
        const timeInCycle = (now / 1000) % TOTAL_DURATION;
        
        if (roundId !== currentRoundId) {
             // ---- NEW ROUND LOGIC ----
            setRoundId(currentRoundId);

            // On a new round, the winner of the *previous* round is determined
            const { winner: previousWinner } = getWinnerForRound(currentRoundId - 1);
            
            // Update history
            setHistory(prev => [previousWinner, ...prev.slice(0, 4)]);
            
            // Reset bets for the new round
            setBets({});
        }
        
        if (timeInCycle < ROUND_DURATION) {
            // --- BETTING PHASE ---
            if (isSpinning) { // Spin just finished
                setIsSpinning(false);
            }
            setTimer(ROUND_DURATION - Math.floor(timeInCycle));
            setHighlightPosition(null);
        } else {
            // --- SPINNING PHASE ---
            if (!isSpinning) {
                // ---- START OF SPIN PHASE ----
                setIsSpinning(true);
                const { winner } = getWinnerForRound(currentRoundId);

                // 1. Generate animation sequence
                const winnerIndex = VISUAL_SPIN_ORDER.indexOf(winner);
                if (winnerIndex === -1) {
                    animationSequenceRef.current = [winner];
                } else {
                    const spins = 3; // How many full loops
                    const totalLength = (VISUAL_SPIN_ORDER.length * spins) + winnerIndex + 1;
                    const sequence = Array.from({ length: totalLength }, (_, i) => {
                        return VISUAL_SPIN_ORDER[i % VISUAL_SPIN_ORDER.length];
                    });
                    animationSequenceRef.current = sequence;
                }
                
                // 2. Schedule results to appear *after* the spin
                setTimeout(() => {
                    // We get the winner again to be 100% sure, though it should be the same.
                    const { winner: finalWinner } = getWinnerForRound(currentRoundId);
                    const payout = (bets[finalWinner] || 0) * FRUITS[finalWinner].multiplier;
                    if (payout > 0) {
                        setBalance(prev => prev + payout);
                        setWinnerScreenInfo({ fruit: finalWinner, payout: payout });
                        setTimeout(() => setWinnerScreenInfo(null), 4000); // Show winner screen for 4s
                    }
                }, SPIN_DURATION * 1000); // Delay equals spin duration
            }
            
            // --- Handle spinning animation ---
            setTimer(0);
            const spinTime = timeInCycle - ROUND_DURATION; // time elapsed in spin
            const sequence = animationSequenceRef.current;
            
            if(sequence.length === 0) return;

            const highlightDuration = SPIN_DURATION / sequence.length;
            const highlightIndex = Math.floor(spinTime / highlightDuration);
            const currentFruit = sequence[Math.min(highlightIndex, sequence.length - 1)];

            if (currentFruit) {
               if (gridRef.current) {
                  const fruitElement = gridRef.current.querySelector(`[data-fruit-id="${currentFruit}"]`) as HTMLElement;
                  if (fruitElement) {
                      setHighlightPosition({
                          top: fruitElement.offsetTop,
                          left: fruitElement.offsetLeft,
                          width: fruitElement.offsetWidth,
                          height: fruitElement.offsetHeight
                      });
                  }
              }
            }
        }
    };

    const interval = setInterval(updateGameState, 50); 
    
    return () => {
      clearInterval(interval)
    };
}, [isClient, roundId, isSpinning, bets, winnerScreenInfo]);

  const handlePlaceBet = (fruit: FruitKey) => {
    if (isSpinning || timer <= 0) {
      toast({ title: "انتهى وقت الرهان", description: "انتظر حتى الجولة القادمة", variant: "destructive", duration: 2000 });
      return;
    }
    
    const currentBetSlots = Object.keys(bets).length;
    if (!bets[fruit] && currentBetSlots >= MAX_BET_SLOTS) {
        toast({ 
            title: "تم الوصول للحد الأقصى", 
            description: `لا يمكنك المراهنة على أكثر من ${MAX_BET_SLOTS} خيارات.`, 
            variant: "destructive",
            duration: 2000,
        });
        return;
    }

    if (balance < activeBet) {
       toast({ title: "رصيد غير كاف", description: "ليس لديك ما يكفي من الرصيد للقيام بهذا الرهان", variant: "destructive" });
       return;
    }
    setBalance(prev => prev - activeBet);
    setBets(prev => ({
        ...prev,
        [fruit]: (prev[fruit] || 0) + activeBet
    }));
  };
  

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans" dir="rtl">
        <div className="text-2xl font-bold">...تحميل اللعبة</div>
      </div>
    );
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
    exit: { opacity: 0 },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  
  const displayRoundId = (roundId % 1000) + 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans overflow-hidden" dir="rtl">
       <AnimatePresence>
       {winnerScreenInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md h-auto">
              <FallingCoins />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-gradient-to-br from-yellow-400/10 via-purple-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border-4 border-yellow-400 shadow-[0_0_30px_#facc15] text-center flex flex-col items-center gap-4"
              >
                <motion.h2 variants={itemVariants} className="text-4xl sm:text-5xl font-bold text-white mb-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  مبروووك!
                </motion.h2>
                <motion.div
                  variants={itemVariants}
                  initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.3 }}
                  className="my-2"
                >
                  <FruitDisplay fruitType={winnerScreenInfo.fruit} size="large" />
                </motion.div>
                <motion.p variants={itemVariants} className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  لقد ربحت
                </motion.p>
                <motion.p variants={itemVariants} className="text-4xl sm:text-5xl font-bold text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  {formatNumber(winnerScreenInfo.payout)} كوينز
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-sm flex flex-col items-center">
        <header className="w-full flex justify-between items-center mb-2 gap-4">
            {/* New Balance Display */}
            <div className="flex-1 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-lg p-2 border-2 border-yellow-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_4px_6px_rgba(0,0,0,0.2)]">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-black/80" style={{textShadow: '1px 1px 1px rgba(255,255,255,0.3)'}}>رصيدك</span>
                    <span className="text-xl font-bold text-black" style={{textShadow: '1px 1px 2px rgba(255,255,255,0.5)'}}>{balance.toLocaleString('en-US')}</span>
                </div>
            </div>

            {/* Existing Claim Reward Button */}
            <button 
                onClick={handleClaimReward}
                disabled={!canClaim}
                className={cn(
                    "bg-black/30 px-4 py-2 rounded-full border border-yellow-400/50 flex flex-col items-center text-center transition-all duration-300",
                    canClaim ? "cursor-pointer hover:bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.4)]" : "cursor-not-allowed opacity-60"
                )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-bold">استلام الجائزة</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift text-yellow-400"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 5a4.8 8 0 0 1 4.5 3 2.5 2.5 0 0 1 0 5"/></svg>
              </div>
              <span className={cn("text-xs mt-1", canClaim ? "text-green-400" : "text-gray-400")}>
                {timeUntilNextClaim}
              </span>
            </button>
        </header>

        <div className="text-center mb-4 text-yellow-300 font-bold text-lg bg-black/20 py-1 px-4 rounded-full border border-yellow-400/30">
          الجولة: {displayRoundId}
        </div>
      </div>


      <main className="w-full max-w-sm bg-black/20 p-3 rounded-3xl border border-yellow-400/30">
        <div className="relative grid grid-cols-3 gap-3" ref={gridRef}>
            <AnimatePresence>
              {highlightPosition && isSpinning && (
                <motion.div
                  className="absolute z-10 rounded-2xl ring-2 ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.7)] pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    top: highlightPosition.top,
                    left: highlightPosition.left,
                    width: highlightPosition.width,
                    height: highlightPosition.height,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 1200, damping: 60, mass: 0.5 }}
                />
              )}
            </AnimatePresence>

          {GRID_LAYOUT.map((item, index) => {
            if (item === 'timer') {
              return (
                <div key="timer" className={cn(
                  "relative flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border-2 border-yellow-400 shadow-[inset_0_0_15px_rgba(255,215,0,0.5)] aspect-square"
                )}>
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-white z-10">{isSpinning ? '...' : (timer > 0 ? timer : 0)}</div>
                        <div className="text-sm text-yellow-300 mt-1">{isSpinning ? 'حظ موفق' : 'وقت الرهان'}</div>
                    </div>
                </div>
              );
            }
            const fruitKey = item as FruitKey;
            
            return (
              <div
                key={`${fruitKey}-${index}`}
                data-fruit-id={fruitKey}
                className={cn(
                    "relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-100 aspect-square bg-black/30",
                     isSpinning && "opacity-60",
                )}
                onClick={() => handlePlaceBet(fruitKey)}
              >
                <FruitDisplay fruitType={fruitKey} />
                {bets[fruitKey] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                        {formatNumber(bets[fruitKey])}
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full max-w-sm mt-4 flex flex-col items-center">
        <div className="flex justify-center gap-1 mb-2 w-full">
          {BET_AMOUNTS.map((amount) => (
            <button 
                key={amount} 
                onClick={() => setActiveBet(amount)}
                className={cn(
                    'px-2 py-1 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2',
                    activeBet === amount
                        ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]'
                        : 'bg-black/30 text-white border-yellow-400/50'
                )}
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-yellow-300 ml-2">الجولات:</span>
          <div className="flex flex-1 justify-evenly items-center h-10">
            {history.length > 0 ? history.map((fruitKey, index) => (
              <div key={`${fruitKey}-${index}`} className="relative">
                <div className={cn("bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center", index === 0 && "scale-110 border-2 border-yellow-300")}>
                   <FruitDisplay fruitType={fruitKey} size="small" showMultiplier={false} />
                </div>
                {index === 0 && !isSpinning && (
                   <div className="absolute -top-3 -right-3 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
                        New
                    </div>
                )}
              </div>
            )) : <span className="text-xs text-gray-400">لا يوجد تاريخ بعد</span>}
             {Array.from({ length: Math.max(0, 5 - history.length) }).map((_, i) => (
                <div key={`placeholder-${i}`} className="w-8 h-8" />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
