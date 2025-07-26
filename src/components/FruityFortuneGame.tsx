
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGameHistory } from '@/hooks/useFirebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Coins, Trophy, RefreshCw } from 'lucide-react';

// Fruit image URLs
const FRUIT_IMAGES = {
  apple: '/apple.png',
  cherry: '/cherry.png',
  grapes: '/grapes.png',
  lemon: '/lemon.png',
  orange: '/orange.png',
  pear: '/pear.png',
  strawberry: '/strawberry.png',
  watermelon: '/watermelon.png'
};

// Types
interface UserProfile {
    name: string;
    image: string;
    userId: string;
}

type FruitKey = 'apple' | 'cherry' | 'grapes' | 'lemon' | 'orange' | 'pear' | 'strawberry' | 'watermelon';

interface Fruit {
  name: string;
  multiplier: number;
  image: string;
  color: string;
}

interface TopWinner {
  user: UserProfile;
  betAmount: number;
  payout: number;
}

// Constants
const FRUITS: Record<FruitKey, Fruit> = {
  apple: { name: 'تفاح', multiplier: 5, image: FRUIT_IMAGES.apple, color: '#ff4d4d' },
  cherry: { name: 'كرز', multiplier: 10, image: FRUIT_IMAGES.cherry, color: '#ff8a4d' },
  grapes: { name: 'عنب', multiplier: 15, image: FRUIT_IMAGES.grapes, color: '#ffc14d' },
  lemon: { name: 'ليمون', multiplier: 25, image: FRUIT_IMAGES.lemon, color: '#c1ff4d' },
  orange: { name: 'برتقال', multiplier: 45, image: FRUIT_IMAGES.orange, color: '#4dffc1' },
  pear: { name: 'كمثرى', multiplier: 5, image: FRUIT_IMAGES.pear, color: '#4dc1ff' },
  strawberry: { name: 'فراولة', multiplier: 10, image: FRUIT_IMAGES.strawberry, color: '#c14dff' },
  watermelon: { name: 'بطيخ', multiplier: 15, image: FRUIT_IMAGES.watermelon, color: '#ff4dc1' },
};

const BET_AMOUNTS = [100000, 500000, 1000000, 5000000, 10000000];
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

    // Use roundId as seed for deterministic results
    const seed = roundId;
    const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        return min + (x - Math.floor(x)) * (max - min);
    };

    // Calculate rounds since last big win (multiplier >= 25)
    let roundsSinceBigWin = 0;
    for (let i = roundId - 1; i >= Math.max(0, roundId - 10); i--) {
        const prevWinner = getWinnerForRound(i);
        if (FRUITS[prevWinner.winner].multiplier >= 25) {
            break;
        }
        roundsSinceBigWin++;
    }
    
    // Cap at 5+ rounds
    const level = Math.min(roundsSinceBigWin, 5);
    const probabilities = PROBABILITY_MATRIX[level];
    
    // Generate random number
    const rand = random(0, 1);
    let cumulativeProb = 0;
    let selectedMultiplier = 5; // default

    // Select multiplier based on probabilities
    for (const [multiplier, prob] of Object.entries(probabilities)) {
        cumulativeProb += prob;
        if (rand <= cumulativeProb) {
            selectedMultiplier = parseInt(multiplier);
            break;
        }
    }

    // Select random fruit with that multiplier
    const availableFruits = FRUITS_BY_MULTIPLIER[selectedMultiplier];
    const fruitIndex = Math.floor(random(0, availableFruits.length));
    const winner = availableFruits[fruitIndex];

    const isBigWin = FRUITS[winner].multiplier >= 25;
    
    const result = { winner, isBigWin };
    deterministicWinnerCache.set(roundId, result);
    return result;
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        const millions = num / 1000000;
        return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
    }
    if (num >= 1000) {
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands.toFixed(1)}k` : `${thousands.toFixed(1)}k`;
    }
    return num.toLocaleString('en-US');
  }

export default function FruityFortuneGame({ user, balance, onBalanceChange }: { user: UserProfile, balance: number; onBalanceChange: (updater: (prev: number) => number) => void; }) {
  const [isClient, setIsClient] = useState(false);
  const [activeBet, setActiveBet] = useState(BET_AMOUNTS[0]);
  
  // Game state driven by time
  const [roundId, setRoundId] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerScreenInfo, setWinnerScreenInfo] = useState<{fruit: FruitKey, payout: number, topWinners: TopWinner[]} | null>(null);

  const [history, setHistory] = useState<FruitKey[]>([]);
  const [bets, setBets] = useState<Record<FruitKey, number>>({} as Record<FruitKey, number>);
  
  const { toast } = useToast();
  const { saveGameHistory, saveUserBets, getUserBets } = useGameHistory();

  const animationSequenceRef = useRef<FruitKey[]>([]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [highlightPosition, setHighlightPosition] = useState<{top: number, left: number, width: number, height: number} | null>(null);

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
        const userBets = await getUserBets(user.userId, currentRoundId);
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
        userId: user.userId,
        roundId: roundId,
        bets: bets
      });
    }
  }, [bets, roundId, isClient, user.userId, saveUserBets]);
  
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
            
            // Save game history to Firebase
            saveGameHistory({
              roundId: currentRoundId - 1,
              winner: previousWinner
            });
            
            // Reset bets for the new round
             setBets({} as Record<FruitKey, number>);
        }
        
        // Update timer
        if (timeInCycle < ROUND_DURATION) {
            setTimer(ROUND_DURATION - timeInCycle);
                setIsSpinning(false);
        } else {
            setTimer(0);
                setIsSpinning(true);
            
            // Show winner screen at the end of spin
            if (timeInCycle >= TOTAL_DURATION - 1 && !winnerScreenInfo) {
                const { winner } = getWinnerForRound(currentRoundId - 1);
                const payout = (bets[winner] || 0) * FRUITS[winner].multiplier;
                
                if (payout > 0) {
                    onBalanceChange(prev => prev + payout);
                    toast({
                        title: "مبروك! ربحت!",
                        description: `لقد ربحت ${formatNumber(payout)} من ${FRUITS[winner].name}!`,
                        variant: "default"
                    });
                }

                // Mock top winners for now
                const topWinners: TopWinner[] = [
                    { user, betAmount: bets[winner] || 0, payout }
                ];

                setWinnerScreenInfo({ fruit: winner, payout, topWinners });
                
                // Hide winner screen after 3 seconds
                setTimeout(() => {
                    setWinnerScreenInfo(null);
                }, 3000);
            }
        }

        // Update spinning animation
        if (isSpinning) {
            const spinProgress = (timeInCycle - ROUND_DURATION) / SPIN_DURATION;
            const spinIndex = Math.floor(spinProgress * VISUAL_SPIN_ORDER.length * 3);
            const currentFruit = VISUAL_SPIN_ORDER[spinIndex % VISUAL_SPIN_ORDER.length];

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
}, [isClient, roundId, isSpinning, bets, winnerScreenInfo, onBalanceChange, user, toast, saveGameHistory]);

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
    onBalanceChange(prev => prev - activeBet);
    setBets(prev => ({
        ...prev,
        [fruit]: (prev[fruit] || 0) + activeBet
    }));
  };
  
  const handleRemoveBet = (fruit: FruitKey) => {
    if (isSpinning || timer <= 0) {
      toast({ title: "انتهى وقت الرهان", description: "لا يمكن إزالة الرهان الآن", variant: "destructive", duration: 2000 });
      return;
    }

    const betAmount = bets[fruit] || 0;
    if (betAmount > 0) {
      onBalanceChange(prev => prev + betAmount);
      setBets(prev => {
        const newBets = { ...prev };
        delete newBets[fruit];
        return newBets;
      });
    }
  };

  const totalBetAmount = Object.values(bets).reduce((sum, bet) => sum + bet, 0);
  const potentialWinnings = Object.entries(bets).reduce((max, [fruit, bet]) => {
    const potential = bet * FRUITS[fruit as FruitKey].multiplier;
    return Math.max(max, potential);
  }, 0);

  if (!isClient) {
    return <div className="text-center p-8">جاري التحميل...</div>;
  }

  if (winnerScreenInfo) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-background p-8 rounded-lg text-center max-w-md mx-4"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">الفائز!</h2>
          <div className="flex items-center justify-center mb-4">
            <img 
              src={FRUITS[winnerScreenInfo.fruit].image} 
              alt={FRUITS[winnerScreenInfo.fruit].name}
              className="w-16 h-16 mr-2"
            />
            <span className="text-xl">{FRUITS[winnerScreenInfo.fruit].name}</span>
          </div>
          <div className="text-3xl font-bold text-green-500 mb-4">
            {formatNumber(winnerScreenInfo.payout)}
          </div>
          <div className="text-sm text-muted-foreground">
            الجولة القادمة تبدأ قريباً...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Timer className="w-5 h-5" />
          <span className="font-bold">{Math.ceil(timer)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5" />
          <span className="font-bold">{formatNumber(balance)}</span>
        </div>
      </div>

      {/* Timer Progress */}
      <Progress value={(timer / ROUND_DURATION) * 100} className="h-2" />

      {/* Game Grid */}
      <div 
        ref={gridRef}
        className="grid grid-cols-3 gap-2 relative"
      >
        {GRID_LAYOUT.map((item, index) => (
          <div key={index} className="aspect-square">
            {item === 'timer' ? (
              <Card className="h-full flex items-center justify-center bg-primary/10 border-primary">
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.ceil(timer)}</div>
                  <div className="text-xs text-muted-foreground">ثانية</div>
                </div>
              </Card>
            ) : (
              <Card 
                className={`h-full cursor-pointer transition-all duration-200 hover:scale-105 ${
                  bets[item] ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => bets[item] ? handleRemoveBet(item) : handlePlaceBet(item)}
              >
                <CardContent className="p-2 h-full flex flex-col items-center justify-center relative">
                  <img 
                    src={FRUITS[item].image} 
                    alt={FRUITS[item].name}
                    className="w-8 h-8 mb-1"
                    data-fruit-id={item}
                  />
                  <div className="text-xs font-bold">{FRUITS[item].name}</div>
                  <Badge variant="secondary" className="text-xs">
                    {FRUITS[item].multiplier}x
                  </Badge>
                  {bets[item] && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {formatNumber(bets[item])}
                        </div>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
        ))}
        
        {/* Highlight overlay for spinning animation */}
        {highlightPosition && (
          <div 
            className="absolute border-4 border-yellow-400 rounded-lg pointer-events-none animate-pulse"
            style={{
                    top: highlightPosition.top,
                    left: highlightPosition.left,
                    width: highlightPosition.width,
                    height: highlightPosition.height,
            }}
          />
        )}
                </div>

      {/* Bet Controls */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {BET_AMOUNTS.map((amount) => (
            <Button
                key={amount} 
              variant={activeBet === amount ? "default" : "outline"}
              size="sm"
                onClick={() => setActiveBet(amount)}
              className="whitespace-nowrap"
            >
              {formatNumber(amount)}
            </Button>
          ))}
        </div>
        
        <div className="flex justify-between text-sm">
          <span>إجمالي الرهان: {formatNumber(totalBetAmount)}</span>
          <span>أقصى ربح محتمل: {formatNumber(potentialWinnings)}</span>
        </div>
                </div>

      {/* History */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4" />
          <span className="font-bold">التاريخ</span>
                    </div>
        <div className="flex gap-2 overflow-x-auto">
          {history.map((fruit, index) => (
            <div key={index} className="flex-shrink-0">
              <img 
                src={FRUITS[fruit].image} 
                alt={FRUITS[fruit].name}
                className="w-8 h-8"
              />
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
