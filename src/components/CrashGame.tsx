
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Coins, Wallet } from 'lucide-react';
import type { UserProfile as IUserProfile, GameInfo, DifficultyLevel } from '@/lib/firebaseServices';
import { useToast } from '@/hooks/use-toast';
import { gameServices } from '@/lib/firebaseServices';

// --- Types ---
interface UserProfile extends IUserProfile {}

interface CrashGameProps {
  user: UserProfile;
  balance: number;
  onBalanceChange: (updater: (prev: number) => number) => void;
  gameInfo: GameInfo | null;
}

interface HistoryItem {
  multiplier: number;
  color: string;
}

// --- Constants for Game Cycle ---
const BETTING_DURATION = 10000; // 10 seconds for betting
const MAX_FLIGHT_DURATION = 10000; // 10 seconds max flight time
const COOLDOWN_DURATION = 3000; // 3 seconds after crash
const TOTAL_CYCLE_DURATION = BETTING_DURATION + MAX_FLIGHT_DURATION + COOLDOWN_DURATION;

const GAME_STATE = {
  BETTING: 'betting',
  IN_PROGRESS: 'in_progress',
  CRASHED: 'crashed',
};
const BET_AMOUNTS = [100000, 1000000, 5000000, 10000000, 30000000, 50000000, 100000000];


function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}m`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
}

// Deterministic crash point calculation based on a seed (roundId)
const getCrashPoint = (seed: number, difficulty: DifficultyLevel): number => {
    // This function generates a pseudo-random number between 0 and 1 based on the seed.
    const pseudoRandom = (offset = 0) => {
      let x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    // Rule: Crash at 1.00x frequently (e.g., ~20% of the time)
    // We can use the roundId (seed) to make this deterministic.
    if (seed % 5 === 0) { // Crashes on every 5th round ID
        return 1.00;
    }
    
    // Rule: Rarely go above 3.00x
    // Let's make it happen on a specific interval, e.g., every 13 rounds
    if (seed % 13 === 0) {
        // High-payout round: between 3x and 15x
        return 3 + pseudoRandom(1) * 12;
    }

    // Rule: Normal rounds are capped around 3.00x
    // This will generate a value between 1.01 and 3.00, with more results towards the lower end.
    const r = pseudoRandom(2);
    // Using Math.pow(r, 3) makes lower values more frequent
    const crashPoint = 1.01 + Math.pow(r, 3) * 2; 
    
    return parseFloat(crashPoint.toFixed(2));
};

export default function CrashGame({ user, balance, onBalanceChange, gameInfo }: CrashGameProps) {
  const [betAmount, setBetAmount] = useState(BET_AMOUNTS[0]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('hard');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // States related to the current user's interaction
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [currentRoundId, setCurrentRoundId] = useState(0);

  // States derived from the game loop
  const [gameState, setGameState] = useState(GAME_STATE.BETTING);
  const [countdown, setCountdown] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);

  const { toast } = useToast();
  const animationFrameRef = useRef<number>();
  const lastHistoryUpdateRoundIdRef = useRef<number>(0);


  useEffect(() => {
    if (!gameInfo) return;
    const unsubscribe = gameServices.onDifficultyChange(gameInfo.id, setDifficulty);
    return () => unsubscribe();
  }, [gameInfo]);
  
  // The main game loop, driven by requestAnimationFrame for smooth UI updates
  const gameLoop = useCallback(() => {
    const now = Date.now();
    const roundId = Math.floor(now / TOTAL_CYCLE_DURATION);
    const timeInCycle = now % TOTAL_CYCLE_DURATION;
    
    // --- Round Management ---
    if (roundId !== currentRoundId) {
        setCurrentRoundId(roundId);
        setPlayerBet(null);
        setHasCashedOut(false);
    }
    
    // --- Determine Game State and Multiplier ---
    const crashPoint = getCrashPoint(roundId, difficulty);
    let currentGameState = GAME_STATE.BETTING;
    let currentMultiplier = 1.00;
    let currentCountdown = 0;

    if (timeInCycle < BETTING_DURATION) {
        // --- BETTING PHASE ---
        currentGameState = GAME_STATE.BETTING;
        currentCountdown = Math.ceil((BETTING_DURATION - timeInCycle) / 1000);

    } else if (timeInCycle < BETTING_DURATION + MAX_FLIGHT_DURATION) {
        const flightTime = timeInCycle - BETTING_DURATION;
        
        const timeInSeconds = flightTime / 1000;
        // Corrected, very slow growth formula.
        // A coefficient of ~0.05 makes it take several seconds to reach 2.0x
        const calculatedMultiplier = 1 + 0.05 * Math.pow(timeInSeconds, 2);

        if (calculatedMultiplier >= crashPoint) {
             // --- CRASHED (COOLDOWN) PHASE ---
             currentGameState = GAME_STATE.CRASHED;
             currentMultiplier = crashPoint;
        } else {
            // --- IN_PROGRESS (FLIGHT) PHASE ---
            currentGameState = GAME_STATE.IN_PROGRESS;
            currentMultiplier = calculatedMultiplier;
        }
    } else {
        // --- COOLDOWN PHASE (after max flight time) ---
        currentGameState = GAME_STATE.CRASHED;
        currentMultiplier = crashPoint; // Show the crash point
    }


    setGameState(currentGameState);
    setMultiplier(currentMultiplier);
    setCountdown(currentCountdown);
    
    // --- Update History ---
    // Update history as soon as the previous round crashes
    if (currentGameState === GAME_STATE.BETTING && roundId > lastHistoryUpdateRoundIdRef.current) {
        const finalMultiplier = getCrashPoint(roundId - 1, difficulty);
        const newHistoryItem: HistoryItem = {
          multiplier: finalMultiplier,
          color: finalMultiplier < 2 ? 'text-red-400' : 'text-green-400',
        };
        setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
        lastHistoryUpdateRoundIdRef.current = roundId;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [currentRoundId, difficulty]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);


  const handlePlaceBet = () => {
    if (gameState !== GAME_STATE.BETTING) {
        toast({ variant: 'destructive', title: 'لا يمكنك المراهنة الآن', duration: 2000 });
        return;
    }
    if (balance < betAmount) {
        toast({ variant: 'destructive', title: 'رصيد غير كافٍ', duration: 2000 });
        return;
    }
    if (playerBet) {
        toast({ variant: 'destructive', title: 'لقد وضعت رهانًا بالفعل', duration: 2000 });
        return;
    }
    onBalanceChange(prev => prev - betAmount);
    setPlayerBet(betAmount);
    toast({ title: 'تم وضع الرهان', description: `لقد راهنت بـ ${formatNumber(betAmount)}`, duration: 2000 });
  };

  const handleCashOut = () => {
    if (gameState !== GAME_STATE.IN_PROGRESS || !playerBet || hasCashedOut) {
        return;
    }
    const winnings = playerBet * multiplier;
    onBalanceChange(prev => prev + winnings);
    setHasCashedOut(true);
    toast({
        title: '🎉 تم سحب الأرباح!',
        description: `لقد ربحت ${formatNumber(winnings)} عند ${multiplier.toFixed(2)}x`,
        duration: 2000
    });
  };

  const getButtonState = () => {
    if (gameState === GAME_STATE.BETTING) {
        return {
            text: playerBet ? 'بانتظار الجولة' : 'ضع الرهان',
            onClick: handlePlaceBet,
            disabled: !!playerBet,
            className: 'bg-blue-600 hover:bg-blue-700'
        };
    }
    if (gameState === GAME_STATE.IN_PROGRESS) {
        if (hasCashedOut) {
            return {
                text: 'تم السحب!',
                onClick: () => {},
                disabled: true,
                className: 'bg-yellow-500'
            };
        }
        if (playerBet) {
            return {
                text: `سحب ${formatNumber(playerBet * multiplier)}`,
                onClick: handleCashOut,
                disabled: false,
                className: 'bg-green-600 hover:bg-green-700'
            };
        }
        return {
            text: 'اللعبة جارية...',
            onClick: () => {},
            disabled: true,
            className: 'bg-gray-500'
        };
    }
    if (gameState === GAME_STATE.CRASHED) {
        return {
            text: `الجولة انتهت @ ${multiplier.toFixed(2)}x`,
            onClick: () => {},
            disabled: true,
            className: 'bg-red-600'
        };
    }
    return { text: '', onClick: () => {}, disabled: true, className: '' };
  };

  const buttonState = getButtonState();

  const backgroundStyle = gameInfo?.backgroundImage
    ? { backgroundImage: `url(${gameInfo.backgroundImage})` }
    : {};

  return (
    <div className="flex flex-col h-full bg-[#0d122e] text-white p-4 font-sans" dir="rtl">
      {/* History Bar */}
      <div className="flex-shrink-0 flex items-center justify-center gap-2 mb-4">
        {history.map((item, index) => (
          <Badge key={index} variant="secondary" className={cn("bg-black/20 border-yellow-400/30 text-xs font-bold", item.color)}>
            {item.multiplier.toFixed(2)}x
          </Badge>
        ))}
      </div>

      {/* Game Display */}
      <div 
        className="flex-1 bg-black/30 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden bg-cover bg-center"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="relative z-10">
            {gameState === GAME_STATE.BETTING && (
              <div className="text-center">
                <p className="text-gray-400 text-lg">تبدأ في</p>
                <p className="text-6xl font-bold">{countdown}s</p>
              </div>
            )}
            
            <AnimatePresence>
                {gameState === GAME_STATE.IN_PROGRESS && (
                   <motion.div
                    className="text-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                   >
                    <p className="text-7xl font-bold text-green-400">{multiplier.toFixed(2)}x</p>
                    <motion.div
                        initial={{ y: 50, x: -50, rotate: 45 }}
                        animate={{ y: -100, x: 100, rotate: 0 }}
                        transition={{ duration: 10, ease: 'linear' }}
                    >
                        <Rocket className="w-16 h-16 mx-auto mt-4 text-white" />
                    </motion.div>
                  </motion.div>
                )}
            </AnimatePresence>
            
            {gameState === GAME_STATE.CRASHED && (
              <motion.div
                className="text-center"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-7xl font-bold text-red-500">انفجرت!</p>
                <p className="text-4xl font-bold text-red-400 mt-2">@{multiplier.toFixed(2)}x</p>
              </motion.div>
            )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-black/20 p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{formatNumber(betAmount)}</span>
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-400"/>
            <span className="text-sm text-gray-400">{formatNumber(balance)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {BET_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              size="sm"
              variant={betAmount === amount ? 'default' : 'secondary'}
              className={cn(
                "bg-gray-700/50 text-white hover:bg-gray-600 text-xs",
                betAmount === amount && "bg-blue-600 hover:bg-blue-700"
              )}
              onClick={() => setBetAmount(amount)}
              disabled={gameState !== GAME_STATE.BETTING || !!playerBet}
            >
              {formatNumber(amount)}
            </Button>
          ))}
        </div>

        <Button
          size="lg"
          className={cn(
            "w-full text-lg font-bold h-14",
            buttonState.className
          )}
          onClick={buttonState.onClick}
          disabled={buttonState.disabled}
        >
          {buttonState.text}
        </Button>
      </div>
    </div>
  );
}
