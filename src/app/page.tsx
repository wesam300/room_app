"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Crown, Info, Sparkles } from 'lucide-react';

type Fruit = {
  name: string;
  emoji: string;
  multiplier: number;
};

const FRUITS: Fruit[] = [
  { name: 'Cherry', emoji: '🍒', multiplier: 5 },
  { name: 'Lemon', emoji: '🍋', multiplier: 5 },
  { name: 'Apple', emoji: '🍎', multiplier: 5 },
  { name: 'Watermelon', emoji: '🍉', multiplier: 5 },
  { name: 'Grapes', emoji: '🍇', multiplier: 10 },
  { name: 'Kiwi', emoji: '🥝', multiplier: 15 },
  { name: 'Pineapple', emoji: '🍍', multiplier: 25 },
  { name: 'Mango', emoji: '🥭', multiplier: 45 },
];

const BET_AMOUNTS = [10, 50, 100, 500, 1000];

type GameState = 'idle' | 'betting' | 'result';

export default function FruitGamePage() {
  const [balance, setBalance] = useState(10000);
  const [selectedFruit, setSelectedFruit] = useState<Fruit | null>(null);
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timer, setTimer] = useState(30);
  const [winningFruit, setWinningFruit] = useState<Fruit | null>(null);
  const [resultMessage, setResultMessage] = useState('');

  const handleStartBetting = () => {
    if (!selectedFruit || !selectedBet) {
      setResultMessage('اختر فاكهة ومبلغ الرهان أولاً!');
      setTimeout(() => setResultMessage(''), 2000);
      return;
    }
    if (balance < selectedBet) {
      setResultMessage('رصيدك غير كافٍ!');
      setTimeout(() => setResultMessage(''), 2000);
      return;
    }

    setBalance(prev => prev - selectedBet!);
    setGameState('betting');
    setResultMessage('');
  };
  
  const resetGame = useCallback(() => {
    setGameState('idle');
    setWinningFruit(null);
    setSelectedFruit(null);
    setSelectedBet(null);
    setTimer(30);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'betting') {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameState('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'result') {
      const randomIndex = Math.floor(Math.random() * FRUITS.length);
      const winner = FRUITS[randomIndex];
      setWinningFruit(winner);

      if (winner.name === selectedFruit?.name) {
        const winnings = selectedBet! * winner.multiplier;
        setBalance(prev => prev + winnings);
        setResultMessage(`🎉 فوز! لقد ربحت ${winnings.toLocaleString()} نقطة!`);
      } else {
        setResultMessage('😔 خسارة! حظ أوفر في المرة القادمة.');
      }
      
      setTimeout(() => {
          resetGame();
      }, 5000);
    }
  }, [gameState, selectedBet, selectedFruit, resetGame]);

  const isButtonDisabled = gameState !== 'idle';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 text-white font-sans animate-background-pan overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <header className="absolute top-4 left-4 w-auto z-10">
        <Card className="bg-black/30 backdrop-blur-sm border-purple-400/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Coins className="text-yellow-400" />
              <div className="text-lg">
                <span className="font-bold">{balance.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground -mt-1">رصيدك</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      <div className="relative z-10 flex flex-col items-center">
        
        <AnimatePresence>
          {gameState === 'betting' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-24 text-6xl font-bold text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
            >
              {timer}
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="w-full max-w-2xl bg-black/30 backdrop-blur-sm border-purple-400/50 shadow-2xl shadow-purple-500/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-3">
              {FRUITS.map(fruit => (
                <motion.div
                  key={fruit.name}
                  whileHover={{ scale: isButtonDisabled ? 1 : 1.05 }}
                  whileTap={{ scale: isButtonDisabled ? 1 : 0.95 }}
                  onClick={() => !isButtonDisabled && setSelectedFruit(fruit)}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-300",
                    "bg-black/20 border-2",
                    selectedFruit?.name === fruit.name ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" : "border-purple-600/50",
                    winningFruit?.name === fruit.name && "animate-pulse border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] scale-110",
                    isButtonDisabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="text-4xl">{fruit.emoji}</div>
                  <Badge variant="secondary" className="absolute top-1 right-1 bg-purple-800/80 text-white text-xs">
                    x{fruit.multiplier}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="w-full max-w-2xl mt-4 flex flex-col items-center gap-3">
            <div className="flex gap-2">
                {BET_AMOUNTS.map(amount => (
                    <Button
                    key={amount}
                    variant={selectedBet === amount ? 'default' : 'secondary'}
                    onClick={() => !isButtonDisabled && setSelectedBet(amount)}
                    disabled={isButtonDisabled}
                    className={cn(
                        "bg-black/30 border-purple-400/50 border text-white hover:bg-purple-600/50",
                        selectedBet === amount && "bg-purple-600"
                    )}
                    >
                        {amount.toLocaleString()}
                    </Button>
                ))}
            </div>
            
            <AnimatePresence>
            {resultMessage && (
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center font-bold text-yellow-300 p-2 rounded-lg bg-black/30"
                 >
                    {resultMessage}
                </motion.div>
            )}
            </AnimatePresence>


            <Button 
                size="lg" 
                onClick={handleStartBetting}
                disabled={isButtonDisabled || !selectedFruit || !selectedBet}
                className="w-full max-w-xs text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
                <Sparkles className="mr-2" />
                ابدأ المراهنة
            </Button>
        </div>
      </div>
    </main>
  );
}
