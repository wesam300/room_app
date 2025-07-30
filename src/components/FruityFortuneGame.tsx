
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameHistory, useUser } from '@/hooks/useFirebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Coins, Trophy, RefreshCw, Crown } from 'lucide-react';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserData, UserProfile as IUserProfile, gameServices, userServices, DifficultyLevel, UserBetData } from '@/lib/firebaseServices';


// --- Types ---
export interface FruityFortuneGameProps {
  user: IUserProfile;
  balance: number;
  onBalanceChange: (updater: (prev: number) => number) => void;
}

interface TopWinner {
  user: IUserProfile;
  betAmount: number;
  payout: number;
}

const BET_AMOUNTS = [1000, 100000, 500000, 1000000, 5000000, 10000000];
const ROUND_DURATION = 20; // seconds
const SPIN_DURATION = 4; // seconds
const TOTAL_DURATION = ROUND_DURATION + SPIN_DURATION;
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


const getWinnerForRound = (roundId: number, difficulty: DifficultyLevel, allRoundBets: UserBetData[], playerVipLevel: number = 0): { winner: FruitKey } => {
    // VIP 7+ gets an easy win
    if (playerVipLevel >= 7) {
        difficulty = 'very_easy';
    }

    const pseudoRandom = (seedOffset = 0) => {
        const x = Math.sin(roundId + seedOffset) * 10000;
        return x - Math.floor(x);
    };

    // Calculate total bet amount on each fruit
    const totalBetsPerFruit: Record<FruitKey, number> = FRUIT_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<FruitKey, number>);
    for (const betData of allRoundBets) {
        for (const fruit in betData.bets) {
            totalBetsPerFruit[fruit as FruitKey] += betData.bets[fruit as FruitKey];
        }
    }

    const sortedFruitsByBet = FRUIT_KEYS.sort((a, b) => totalBetsPerFruit[a] - totalBetsPerFruit[b]);

    const getBiasedWinner = (favorMostBet: boolean): FruitKey => {
        // favorMostBet = true for easy, false for hard
        const targetFruits = favorMostBet ? sortedFruitsByBet.slice().reverse() : sortedFruitsByBet;
        
        // If no one bet, just pick a random fruit
        const totalBets = Object.values(totalBetsPerFruit).reduce((a, b) => a + b, 0);
        if (totalBets === 0) {
            return FRUIT_KEYS[Math.floor(pseudoRandom() * FRUIT_KEYS.length)];
        }
        
        // Find fruits that have bets on them
        const betOnFruits = targetFruits.filter(fruit => totalBetsPerFruit[fruit] > 0);
        
        // If there are fruits with bets, pick from them based on bias
        if (betOnFruits.length > 0) {
            // Give a high chance (e.g., 70%) to pick the most/least bet-on fruit
            if (pseudoRandom() < 0.7) {
                return betOnFruits[0];
            }
            // Otherwise, pick another one that has bets on it
            return betOnFruits[Math.floor(pseudoRandom() * betOnFruits.length)];
        }
        
        // If no fruits with bets are found (edge case), pick from the list of all fruits
        return targetFruits[0];
    };


    switch (difficulty) {
        case 'very_easy':
        case 'easy':
            return { winner: getBiasedWinner(true) };
        case 'hard':
        case 'very_hard':
            return { winner: getBiasedWinner(false) };
        case 'impossible':
            // Choose a fruit with zero bets on it, if possible.
            const noBetFruits = FRUIT_KEYS.filter(f => totalBetsPerFruit[f] === 0);
            if (noBetFruits.length > 0) {
                return { winner: noBetFruits[Math.floor(pseudoRandom() * noBetFruits.length)] };
            }
            // If all fruits have bets, choose the one with the lowest bet.
            return { winner: sortedFruitsByBet[0] };
        case 'medium_hard':
            // 50/50 chance to be medium or hard
            return pseudoRandom() < 0.5 ? getWinnerForRound(roundId, 'medium', allRoundBets, playerVipLevel) : { winner: getBiasedWinner(false) };
        case 'medium':
        default:
             // Default pseudo-random selection based on roundId
            const winnerIndex = Math.floor(pseudoRandom() * FRUIT_KEYS.length);
            return { winner: FRUIT_KEYS[winnerIndex] };
    }
};


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
  
// New Winner Card Component
const WinnerCard = ({ winner, rank }: { winner: TopWinner, rank: number }) => {
    const rankStyles = {
        1: {
            container: 'scale-110 -translate-y-4 z-10',
            border: 'border-yellow-400',
            crownColor: 'text-yellow-400',
            crownIcon: <Crown size={32} className="absolute -top-5 left-1/2 -translate-x-1/2" />,
        },
        2: {
            container: 'scale-100',
            border: 'border-gray-400',
            crownColor: 'text-gray-400',
            crownIcon: <Crown size={24} className="absolute -top-4 left-1/2 -translate-x-1/2" />,
        },
        3: {
            container: 'scale-100',
            border: 'border-amber-600',
            crownColor: 'text-amber-600',
            crownIcon: <Crown size={24} className="absolute -top-4 left-1/2 -translate-x-1/2" />,
        }
    };
    const styles = rankStyles[rank as keyof typeof rankStyles];
  
    return (
        <div className={cn("relative flex flex-col items-center gap-1 transition-all w-24", styles.container)}>
            <div className={cn("relative p-1 rounded-full", styles.border)} style={{ borderWidth: '3px' }}>
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-background">
                    <AvatarImage src={winner.user.image} alt={winner.user.name} />
                    <AvatarFallback>{winner.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={cn("absolute", styles.crownColor)}>
                    {styles.crownIcon}
                </div>
            </div>
            <p className="font-bold text-sm text-white truncate max-w-full">{winner.user.name}</p>
            <p className="font-bold text-base text-yellow-300">{formatNumber(winner.payout)}</p>
        </div>
    )
  }

export default function FruityFortuneGame({ user, balance, onBalanceChange }: FruityFortuneGameProps) {
  const [isClient, setIsClient] = useState(false);
  const [activeBet, setActiveBet] = useState(BET_AMOUNTS[0]);
  
  // Game state driven by time
  const [roundId, setRoundId] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerScreenInfo, setWinnerScreenInfo] = useState<{fruit: FruitKey, payout: number, topWinners: TopWinner[]} | null>(null);
  const [previousWinner, setPreviousWinner] = useState<FruitKey | null>(null);

  const [history, setHistory] = useState<FruitKey[]>([]);
  const [bets, setBets] = useState<Record<FruitKey, number>>({} as Record<FruitKey, number>);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const { userData } = useUser(user.userId);

  const { toast } = useToast();
  const { saveGameHistory, saveUserBets, getUserBets } = useGameHistory();

  const animationSequenceRef = useRef<FruitKey[]>([]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [highlightPosition, setHighlightPosition] = useState<{top: number, left: number, width: number, height: number} | null>(null);

  useEffect(() => {
    const unsubscribe = gameServices.onDifficultyChange('fruity_fortune', setDifficulty);
    return () => unsubscribe();
  }, []);

  // Load state from Firebase on initial mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const now = Date.now();
    const currentRoundId = Math.floor(now / (TOTAL_DURATION * 1000));
    setRoundId(currentRoundId);
    
    // Load game history from Firebase
    const loadGameHistory = async () => {
      try {
        // Load user bets for current round
        const userBets = await getUserBets('fruity_fortune', user.userId, currentRoundId);
        if (userBets) {
          setBets(userBets.bets);
        }
      } catch (error) {
        console.error('Error loading game history:', error);
      }
    };

    loadGameHistory();
    
  }, [isClient, user.userId, getUserBets]);

  // Save state to Firebase whenever it changes
  useEffect(() => {
    if (isClient && Object.keys(bets).length > 0) {
      saveUserBets({
        gameId: 'fruity_fortune',
        userId: user.userId,
        roundId: roundId,
        bets: bets
      });
    }
  }, [bets, roundId, isClient, user.userId, saveUserBets]);
  
  // The main game loop, driven by a simple interval
  const calculateAndShowResults = useCallback(async (currentRoundId: number) => {
      const allRoundBets = await gameServices.getAllBetsForRound('fruity_fortune', currentRoundId);
      const playerVipLevel = userData?.vipLevel ?? 0;
      const { winner: finalWinner } = getWinnerForRound(currentRoundId, difficulty, allRoundBets, playerVipLevel);
      const allUsers = await userServices.getAllUsers();
      const userMap = new Map<string, UserData>(
        allUsers.filter(u => u && u.profile).map(u => [u.profile.userId, u])
      );

      let allWinners: TopWinner[] = [];
      for (const betData of allRoundBets) {
          const betAmountOnWinner = betData.bets[finalWinner] || 0;
          if (betAmountOnWinner > 0) {
              const payout = betAmountOnWinner * FRUITS[finalWinner].multiplier;
              const playerInfo = userMap.get(betData.userId);
              if (playerInfo) {
                  allWinners.push({
                      user: playerInfo.profile,
                      betAmount: betAmountOnWinner,
                      payout: payout,
                  });
              }
          }
      }

      allWinners.sort((a, b) => b.payout - a.payout);

      const myPayout = (bets[finalWinner] || 0) * FRUITS[finalWinner].multiplier;

      if (myPayout > 0) {
          onBalanceChange(prev => prev + myPayout);
      }
      
      setPreviousWinner(finalWinner);
      setWinnerScreenInfo({ fruit: finalWinner, payout: myPayout, topWinners: allWinners.slice(0, 3) });
      setTimeout(() => setWinnerScreenInfo(null), 5000); // Show winner screen for 5s

  }, [bets, onBalanceChange, difficulty, userData]);

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

            // Update history with the winner from the previous round
            if (previousWinner) {
                setHistory(prev => [previousWinner, ...prev.slice(0, 4)]);
                 saveGameHistory({
                    roundId: currentRoundId - 1,
                    winner: previousWinner
                });
            }
            
            // Reset bets for the new round
             setBets({} as Record<FruitKey, number>);
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
                
                // We need to calculate the winner just before spinning starts
                (async () => {
                    const allRoundBets = await gameServices.getAllBetsForRound('fruity_fortune', currentRoundId);
                    const playerVipLevel = userData?.vipLevel ?? 0;
                    const { winner } = getWinnerForRound(currentRoundId, difficulty, allRoundBets, playerVipLevel);
                    
                    // 1. Generate animation sequence
                    const winnerIndex = VISUAL_SPIN_ORDER.indexOf(winner);
                    const spins = 3; // How many full loops
                    const totalLength = (VISUAL_SPIN_ORDER.length * spins) + winnerIndex + 1;
                    const sequence = Array.from({ length: totalLength }, (_, i) => {
                        return VISUAL_SPIN_ORDER[i % VISUAL_SPIN_ORDER.length];
                    });
                    animationSequenceRef.current = sequence;
                    
                    // 2. Schedule results to appear *after* the spin
                    setTimeout(() => {
                        calculateAndShowResults(currentRoundId);
                    }, SPIN_DURATION * 1000); // Delay equals spin duration
                })();
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
}, [isClient, roundId, isSpinning, bets, winnerScreenInfo, saveGameHistory, calculateAndShowResults, previousWinner, difficulty, userData]);

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
       toast({ title: "رصيد غير كاف", description: "ليس لديك ما يكفي من الرصيد للقيام بهذا الرهان", variant: "destructive", duration: 2000 });
       return;
    }
    onBalanceChange(prev => prev - activeBet);
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
        staggerChildren: 0.1,
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
    <div className="flex flex-col items-center justify-start h-full bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-2 sm:p-4 font-sans overflow-hidden" dir="rtl">
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
                 <motion.div
                  variants={itemVariants}
                  initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                  className="my-2"
                >
                  <FruitDisplay fruitType={winnerScreenInfo.fruit} size="large" />
                </motion.div>

                {winnerScreenInfo.payout > 0 ? (
                    <>
                        <motion.p variants={itemVariants} className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          لقد ربحت
                        </motion.p>
                        <motion.p variants={itemVariants} className="text-4xl sm:text-5xl font-bold text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                          {formatNumber(winnerScreenInfo.payout)} كوينز
                        </motion.p>
                    </>
                ) : (
                    <motion.p variants={itemVariants} className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                       حظ أوفر في المرة القادمة!
                    </motion.p>
                )}

                {winnerScreenInfo.topWinners.length > 0 && (
                    <motion.div variants={itemVariants} className="w-full mt-4">
                        <div className="flex justify-center items-center mb-2">
                             <div className="h-px flex-1 bg-yellow-400/50"></div>
                             <h3 className="flex-shrink-0 mx-4 text-lg font-bold text-yellow-300">أكبر الفائزين</h3>
                             <div className="h-px flex-1 bg-yellow-400/50"></div>
                        </div>

                        <div className="grid grid-cols-3 items-end h-40">
                             {/* Rank 3 - Left */}
                             {winnerScreenInfo.topWinners[2] && 
                                <div className="col-start-1 justify-self-start">
                                    <WinnerCard winner={winnerScreenInfo.topWinners[2]} rank={3}/>
                                </div>
                            }
                             {/* Rank 1 - Center */}
                             {winnerScreenInfo.topWinners[0] && 
                                <div className="col-start-2 justify-self-center">
                                    <WinnerCard winner={winnerScreenInfo.topWinners[0]} rank={1}/>
                                </div>
                            }
                            {/* Rank 2 - Right */}
                            {winnerScreenInfo.topWinners[1] && 
                                <div className="col-start-3 justify-self-end">
                                    <WinnerCard winner={winnerScreenInfo.topWinners[1]} rank={2}/>
                                </div>
                            }
                        </div>
                    </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-sm flex flex-col items-center">
        <header className="w-full flex justify-between items-center mb-1 gap-2">
            <div className="flex-1 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-lg p-2 text-center border-2 border-yellow-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_4px_6px_rgba(0,0,0,0.2)]">
                <div className="text-sm font-bold text-black/80" style={{textShadow: '1px 1px 1px rgba(255,255,255,0.3)'}}>رصيدك</div>
                <div className="text-lg font-bold text-black" style={{textShadow: '1px 1px 2px rgba(255,255,255,0.5)'}}>{balance.toLocaleString('en-US')}</div>
            </div>
            <div className="flex-1 bg-black/20 rounded-lg p-2 text-center border border-yellow-400/30">
                <div className="text-sm font-bold text-yellow-300">الجولة</div>
                <div className="text-lg font-bold text-white">{displayRoundId}</div>
            </div>
        </header>
      </div>


      <main className="w-full max-w-sm bg-black/20 p-2 sm:p-3 rounded-3xl border border-yellow-400/30 my-1">
        <div className="relative grid grid-cols-3 gap-2" ref={gridRef}>
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
                        <div className="text-5xl font-bold text-white z-10">{isSpinning ? '...' : (timer > 0 ? Math.ceil(timer) : 0)}</div>
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

      <footer className="w-full max-w-sm flex flex-col items-center mt-auto">
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
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-yellow-300 ml-2">الجولات:</span>
          <div className="flex flex-1 justify-evenly items-center h-8">
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

    
