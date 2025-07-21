
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

type Fruit = {
  id: string;
  name: string;
  multiplier: number;
  image: string;
  hint: string;
};

const FRUITS: Fruit[] = [
  { id: 'watermelon', name: 'بطيخ', multiplier: 5, image: '/fruits/watermelon.png', hint: 'watermelon slice' },
  { id: 'cherry', name: 'كرز', multiplier: 45, image: '/fruits/cherry.png', hint: 'cherries' },
  { id: 'orange', name: 'برتقال', multiplier: 25, image: '/fruits/orange.png', hint: 'orange fruit' },
  { id: 'pear', name: 'كمثرى', multiplier: 5, image: '/fruits/pear.png', hint: 'pear' },
  { id: 'lemon', name: 'ليمون', multiplier: 15, image: '/fruits/lemon.png', hint: 'lemon' },
  { id: 'strawberry', name: 'فراولة', multiplier: 5, image: '/fruits/strawberry.png', hint: 'strawberry' },
  { id: 'apple', name: 'تفاح', multiplier: 5, image: '/fruits/apple.png', hint: 'apple' },
  { id: 'grapes', name: 'عنب', multiplier: 10, image: '/fruits/grapes.png', hint: 'grapes' },
];

const FRUIT_GRID_ORDER: (Fruit | null)[] = [
  FRUITS[0], FRUITS[1], FRUITS[2],
  FRUITS[3], null, FRUITS[4],
  FRUITS[5], FRUITS[6], FRUITS[7]
];

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const GAME_DURATION = 30;
const WAIT_DURATION = 5;

type GameState = 'betting' | 'waiting' | 'spinning' | 'result';
type Bet = { fruitId: string; amount: number };

export default function FruitGamePage() {
  const [balance, setBalance] = useState(10000000);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [countdown, setCountdown] = useState(GAME_DURATION);
  const [winner, setWinner] = useState<Fruit | null>(null);
  const [history, setHistory] = useState<Fruit[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);

  const placeBet = (fruitId: string) => {
    if (gameState !== 'betting') return;
    if (balance < selectedBetAmount) return;

    const newBets = { ...bets };
    const currentBet = newBets[fruitId] || 0;
    newBets[fruitId] = currentBet + selectedBetAmount;

    setBets(newBets);
    setBalance(prev => prev - selectedBetAmount);
  };
  
  const startGame = useCallback(() => {
    setGameState('waiting');
    setCountdown(WAIT_DURATION);
  }, []);

  const runSpinner = useCallback(() => {
    setGameState('spinning');
    const randomIndex = Math.floor(Math.random() * FRUITS.length);
    const winningFruit = FRUITS[randomIndex];
    setWinner(winningFruit);
    
    setTimeout(() => {
      let totalWinnings = 0;
      if (bets[winningFruit.id]) {
        totalWinnings = bets[winningFruit.id] * winningFruit.multiplier;
        setBalance(prev => prev + totalWinnings);
      }
      setLastWinnings(totalWinnings);
      setGameState('result');
      setHistory(prev => [winningFruit, ...prev.slice(0, 7)]);
    }, 3000);
  }, [bets]);

  const resetGame = useCallback(() => {
    setBets({});
    setWinner(null);
    setGameState('betting');
    setCountdown(GAME_DURATION);
    setLastWinnings(0);
  }, []);

  useEffect(() => {
    if (gameState === 'betting' && countdown === 0) {
      startGame();
    }
    
    if (gameState === 'waiting' && countdown === 0) {
        runSpinner();
    }
    
    if (gameState === 'result') {
      const timer = setTimeout(resetGame, 5000);
      return () => clearTimeout(timer);
    }
    
    if (gameState === 'betting' || gameState === 'waiting') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, countdown, startGame, runSpinner, resetGame]);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${amount / 1000000}M`;
    if (amount >= 1000) return `${amount / 1000}K`;
    return amount.toString();
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen p-4 overflow-hidden select-none game-background font-sans">
      <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm p-2 px-4 rounded-full text-lg font-bold text-yellow-300">
        الرصيد: {balance.toLocaleString()}
      </div>

      <main className="flex flex-col items-center gap-6">
        <div className="gold-frame">
          <div className="grid grid-cols-3 gap-3 game-board p-4">
            {FRUIT_GRID_ORDER.map((fruit, index) => {
              if (fruit === null) {
                return (
                  <div key={index} className="flex items-center justify-center w-28 h-28 md:w-36 md:h-36 timer-board">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={countdown}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="text-5xl md:text-6xl font-bold"
                      >
                        {countdown}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                );
              }
              const isWinner = winner?.id === fruit.id;
              return (
                <div
                  key={fruit.id}
                  onClick={() => placeBet(fruit.id)}
                  className={cn(
                    'relative flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-2xl cursor-pointer fruit-slot',
                    { 'winner': isWinner, 'opacity-70': winner && !isWinner }
                  )}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Image src={fruit.image} alt={fruit.name} width={64} height={64} data-ai-hint={fruit.hint} className="md:w-20 md:h-20" />
                  </motion.div>
                  <span className="font-bold text-white text-md mt-1">{fruit.multiplier} مرة</span>
                  {bets[fruit.id] && (
                    <div className="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      {formatAmount(bets[fruit.id])}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-2 md:gap-4">
          {BET_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => setSelectedBetAmount(amount)}
              disabled={gameState !== 'betting'}
              className={cn(
                'w-16 h-16 md:w-20 md:h-20 rounded-full text-lg md:text-xl font-bold bet-button',
                { 'active': selectedBetAmount === amount }
              )}
            >
              <div className="flex flex-col items-center justify-center -space-y-1">
                <span className="text-sm">$</span>
                <span>{formatAmount(amount)}</span>
              </div>
            </button>
          ))}
        </div>
      </main>

       <AnimatePresence>
        {gameState === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10"
          >
            {winner && <Image src={winner.image} alt={winner.name} width={128} height={128} className="drop-shadow-2xl" />}
            {lastWinnings > 0 ? (
              <>
                <h2 className="text-4xl font-bold text-green-400 mt-4"> 🎉 لقد فزت! 🎉</h2>
                <p className="text-2xl text-yellow-300">+{lastWinnings.toLocaleString()}</p>
              </>
            ) : (
              <h2 className="text-4xl font-bold text-red-500 mt-4">💥 حظ أوفر! 💥</h2>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="fixed bottom-0 left-0 right-0 p-3 history-bar flex items-center justify-center gap-4">
          <span className="text-lg font-bold text-yellow-300">التاريخ:</span>
          <div className="flex gap-3">
             {history.map((fruit, index) => (
                <div key={index} className="relative bg-black/30 p-1.5 rounded-full">
                    {index === 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">New</span>
                    )}
                    <Image src={fruit.image} alt={fruit.name} width={32} height={32}/>
                </div>
             ))}
          </div>
      </div>
    </div>
  );
}
