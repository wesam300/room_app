
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Rocket, Coins } from 'lucide-react';
import type { UserProfile as IUserProfile } from '@/lib/firebaseServices';

// --- Types ---
interface UserProfile extends IUserProfile {}

interface CrashGameProps {
  user: UserProfile;
  balance: number;
  onBalanceChange: (updater: (prev: number) => number) => void;
}

// --- Constants ---
const BET_AMOUNTS = [10000, 20000, 50000, 100000];
const GAME_STATE = {
  BETTING: 'betting',
  IN_PROGRESS: 'in_progress',
  CRASHED: 'crashed',
};

// --- Mock Data ---
const MOCK_HISTORY = [
  { multiplier: 1.23, color: 'text-red-400' },
  { multiplier: 3.45, color: 'text-green-400' },
  { multiplier: 1.00, color: 'text-red-400' },
  { multiplier: 10.12, color: 'text-green-400' },
  { multiplier: 2.56, color: 'text-green-400' },
];

export default function CrashGame({ user, balance, onBalanceChange }: CrashGameProps) {
  const [betAmount, setBetAmount] = useState(BET_AMOUNTS[0]);
  const [gameState, setGameState] = useState(GAME_STATE.BETTING);
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(5);

  // This would be replaced with real-time server data
  useEffect(() => {
    if (gameState === GAME_STATE.BETTING) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState(GAME_STATE.IN_PROGRESS);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const handlePlaceBet = () => {
    // Logic to place bet would go here
    console.log(`Bet placed for ${betAmount}`);
  };

  const handleCashOut = () => {
    // Logic to cash out would go here
    console.log(`Cashed out at ${multiplier}x`);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d122e] text-white p-4 font-sans" dir="rtl">
      {/* History Bar */}
      <div className="flex-shrink-0 flex items-center justify-center gap-2 mb-4">
        {MOCK_HISTORY.map((item, index) => (
          <Badge key={index} variant="secondary" className={cn("bg-black/20 border-yellow-400/30 text-xs font-bold", item.color)}>
            {item.multiplier.toFixed(2)}x
          </Badge>
        ))}
      </div>

      {/* Game Display */}
      <div className="flex-1 bg-black/30 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
        {/* Placeholder for the graph/rocket animation */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {gameState === GAME_STATE.BETTING && (
          <div className="text-center">
            <p className="text-gray-400 text-lg">يبدأ في</p>
            <p className="text-6xl font-bold">{countdown}s</p>
          </div>
        )}
        
        {gameState === GAME_STATE.IN_PROGRESS && (
           <motion.div
            className="text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
           >
            <p className="text-7xl font-bold text-green-400">{multiplier.toFixed(2)}x</p>
            <Rocket className="w-24 h-24 mx-auto mt-4 text-white animate-pulse" />
          </motion.div>
        )}
        
        {gameState === GAME_STATE.CRASHED && (
          <div className="text-center">
            <p className="text-7xl font-bold text-red-500">انفجرت!</p>
             <p className="text-4xl font-bold text-red-400 mt-2">@{multiplier.toFixed(2)}x</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-black/20 p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{betAmount.toLocaleString()}</span>
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
          <span className="text-sm text-gray-400">الرصيد: {balance.toLocaleString()}</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {BET_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant={betAmount === amount ? 'default' : 'secondary'}
              className={cn(
                "bg-gray-700/50 text-white hover:bg-gray-600",
                betAmount === amount && "bg-blue-600 hover:bg-blue-700"
              )}
              onClick={() => setBetAmount(amount)}
            >
              {amount.toLocaleString()}
            </Button>
          ))}
        </div>

        <Button
          size="lg"
          className={cn(
            "w-full text-lg font-bold h-14",
            gameState === GAME_STATE.BETTING && "bg-blue-600 hover:bg-blue-700",
            gameState === GAME_STATE.IN_PROGRESS && "bg-green-600 hover:bg-green-700",
            gameState === GAME_STATE.CRASHED && "bg-gray-500"
          )}
          onClick={gameState === GAME_STATE.IN_PROGRESS ? handleCashOut : handlePlaceBet}
          disabled={gameState === GAME_STATE.CRASHED}
        >
          {gameState === GAME_STATE.BETTING && 'ضع الرهان'}
          {gameState === GAME_STATE.IN_PROGRESS && 'سحب'}
          {gameState === GAME_STATE.CRASHED && 'الجولة انتهت'}
        </Button>
      </div>
    </div>
  );
}

// Add this to your globals.css or a style tag if you want the grid pattern
/*
.bg-grid-pattern {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 2rem 2rem;
}
*/
