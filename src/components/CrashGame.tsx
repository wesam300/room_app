
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Coins, Wallet } from 'lucide-react';
import type { UserProfile as IUserProfile } from '@/lib/firebaseServices';
import { useToast } from '@/hooks/use-toast';

// --- Types ---
interface UserProfile extends IUserProfile {}

interface CrashGameProps {
  user: UserProfile;
  balance: number;
  onBalanceChange: (updater: (prev: number) => number) => void;
}

interface HistoryItem {
  multiplier: number;
  color: string;
}

// --- Constants ---
const BET_AMOUNTS = [100000, 1000000, 5000000, 10000000, 30000000, 50000000, 100000000];
const GAME_STATE = {
  BETTING: 'betting',
  IN_PROGRESS: 'in_progress',
  CRASHED: 'crashed',
};
const COUNTDOWN_SECONDS = 5;
const CRASH_DELAY_SECONDS = 3;

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}m`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
}

export default function CrashGame({ user, balance, onBalanceChange }: CrashGameProps) {
  const [betAmount, setBetAmount] = useState(BET_AMOUNTS[0]);
  const [gameState, setGameState] = useState(GAME_STATE.BETTING);
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const { toast } = useToast();
  const crashPointRef = useRef(1.00);
  const multiplierIntervalRef = useRef<NodeJS.Timeout>();

  const resetGame = () => {
    setGameState(GAME_STATE.BETTING);
    setMultiplier(1.00);
    setCountdown(COUNTDOWN_SECONDS);
    setPlayerBet(null);
    setHasCashedOut(false);
  };
  
  // Game Loop Controller
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;

    if (gameState === GAME_STATE.BETTING) {
      countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            setGameState(GAME_STATE.IN_PROGRESS);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === GAME_STATE.IN_PROGRESS) {
        // In a real game, this would be determined by the server.
        const randomCrashPoint = Math.max(1.01, 1 + Math.random() * 19);
        crashPointRef.current = randomCrashPoint;

        multiplierIntervalRef.current = setInterval(() => {
            setMultiplier(prevMultiplier => {
                const newMultiplier = prevMultiplier + 0.01 + (prevMultiplier - 1) * 0.01; // Accelerates slightly
                if (newMultiplier >= crashPointRef.current) {
                    clearInterval(multiplierIntervalRef.current);
                    setGameState(GAME_STATE.CRASHED);
                    return crashPointRef.current;
                }
                return newMultiplier;
            });
        }, 50); // Update multiplier every 50ms
    } else if (gameState === GAME_STATE.CRASHED) {
      const finalMultiplier = crashPointRef.current;
      const newHistoryItem: HistoryItem = {
        multiplier: finalMultiplier,
        color: finalMultiplier < 2 ? 'text-red-400' : 'text-green-400',
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);

      const crashTimer = setTimeout(() => {
        resetGame();
      }, CRASH_DELAY_SECONDS * 1000);
      return () => clearTimeout(crashTimer);
    }

    return () => {
      clearInterval(countdownTimer);
      clearInterval(multiplierIntervalRef.current);
    };
  }, [gameState]);


  const handlePlaceBet = () => {
    if (gameState !== GAME_STATE.BETTING) {
        toast({ variant: 'destructive', title: 'لا يمكنك المراهنة الآن' });
        return;
    }
    if (balance < betAmount) {
        toast({ variant: 'destructive', title: 'رصيد غير كافٍ' });
        return;
    }
    if (playerBet) {
        toast({ variant: 'destructive', title: 'لقد وضعت رهانًا بالفعل' });
        return;
    }
    onBalanceChange(prev => prev - betAmount);
    setPlayerBet(betAmount);
    toast({ title: 'تم وضع الرهان', description: `لقد راهنت بـ ${formatNumber(betAmount)}` });
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
        description: `لقد ربحت ${formatNumber(winnings)} عند ${multiplier.toFixed(2)}x`
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
            text: 'الجولة انتهت',
            onClick: () => {},
            disabled: true,
            className: 'bg-gray-500'
        };
    }
    return { text: '', onClick: () => {}, disabled: true, className: '' };
  };

  const buttonState = getButtonState();

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
      <div className="flex-1 bg-black/30 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
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
              disabled={gameState !== GAME_STATE.BETTING}
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
