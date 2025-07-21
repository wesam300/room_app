
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Fruit = {
  id: string;
  name: string;
  image: string;
  multiplier: number;
  hint: string;
};

const FRUITS: Fruit[] = [
  { id: 'cherry', name: 'كرز', image: 'https://placehold.co/100x100/D62828/FFFFFF.png?text=🍒', multiplier: 5, hint: 'cherry' },
  { id: 'lemon', name: 'ليمون', image: 'https://placehold.co/100x100/F7B731/FFFFFF.png?text=🍋', multiplier: 5, hint: 'lemon' },
  { id: 'apple', name: 'تفاح', image: 'https://placehold.co/100x100/D62828/FFFFFF.png?text=🍎', multiplier: 5, hint: 'apple' },
  { id: 'watermelon', name: 'بطيخ', image: 'https://placehold.co/100x100/28D64A/FFFFFF.png?text=🍉', multiplier: 5, hint: 'watermelon' },
  { id: 'grapes', name: 'عنب', image: 'https://placehold.co/100x100/6A28D6/FFFFFF.png?text=🍇', multiplier: 10, hint: 'grapes' },
  { id: 'kiwi', name: 'كيوي', image: 'https://placehold.co/100x100/84A98C/FFFFFF.png?text=🥝', multiplier: 15, hint: 'kiwi' },
  { id: 'pineapple', name: 'أناناس', image: 'https://placehold.co/100x100/F7B731/FFFFFF.png?text=🍍', multiplier: 25, hint: 'pineapple' },
  { id: 'mango', name: 'مانجو', image: 'https://placehold.co/100x100/F77D71/FFFFFF.png?text=🥭', multiplier: 45, hint: 'mango' },
];

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];

export default function FruityFortunePage() {
  const [balance, setBalance] = useState(10000000);
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState(15);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [winningFruit, setWinningFruit] = useState<Fruit | null>(null);
  const [history, setHistory] = useState<Fruit[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);

  const startRound = useCallback(() => {
    const totalBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    if (totalBet === 0) {
      // Maybe show a toast message: "Please place a bet"
      return;
    }
    if (totalBet > balance) {
      // Maybe show a toast message: "Insufficient balance"
      return;
    }

    setBalance(prev => prev - totalBet);
    setIsGameRunning(true);
    setWinningFruit(null);
    setLastWinnings(0);
    setTimer(15);
  }, [bets, balance]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            endRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameRunning]);

  const endRound = () => {
    const winner = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    setWinningFruit(winner);
    
    let winnings = 0;
    if (bets[winner.id]) {
      winnings = bets[winner.id] * winner.multiplier;
      setBalance(prev => prev + winnings);
    }
    setLastWinnings(winnings);
    
    setHistory(prev => [winner, ...prev.slice(0, 19)]);

    setTimeout(() => {
      setIsGameRunning(false);
      setBets({});
      setWinningFruit(null);
    }, 5000); 
  };

  const placeBet = (fruitId: string) => {
    if (isGameRunning) return;
    setBets(prev => {
      const newBets = { ...prev };
      newBets[fruitId] = (newBets[fruitId] || 0) + selectedBetAmount;
      return newBets;
    });
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const gridItems = [...FRUITS];
  gridItems.splice(4, 0, { id: 'timer', name: 'Timer', image: '', multiplier: 0, hint: '' });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans overflow-hidden" dir="rtl">
      
      <header className="w-full max-w-2xl flex justify-between items-center mb-4">
        <div className="bg-black/30 px-4 py-2 rounded-full border border-yellow-400/50">
          <span className="text-yellow-300 font-bold">الرصيد: {formatNumber(balance)}</span>
        </div>
        <div className="bg-black/30 px-4 py-2 rounded-full border border-yellow-400/50">
          <span className="text-white font-bold">لعبة الفواكه</span>
        </div>
      </header>

      <main className="w-full max-w-2xl bg-black/20 p-4 rounded-3xl border-2 border-yellow-400/80 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
        <div className="grid grid-cols-3 gap-3">
          {gridItems.map((item, index) => {
            if (item.id === 'timer') {
              return (
                <div key="timer" className="relative flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border-2 border-yellow-400 shadow-[inset_0_0_15px_rgba(255,215,0,0.5)] aspect-square">
                  <AnimatePresence>
                    {lastWinnings > 0 && (
                       <motion.div
                         initial={{ opacity: 0, y: -50, scale: 0.5 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 50 }}
                         className="absolute text-2xl font-bold text-green-400 z-10"
                       >
                         +{formatNumber(lastWinnings)}
                       </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="text-5xl font-bold text-white z-0">{isGameRunning ? timer : '💎'}</div>
                </div>
              );
            }
            const fruit = item as Fruit;
            const isWinning = winningFruit?.id === fruit.id;
            return (
              <div
                key={fruit.id}
                onClick={() => placeBet(fruit.id)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-300 aspect-square
                  ${isWinning ? 'bg-yellow-400 scale-110 shadow-[0_0_25px_#facc15]' : 'bg-black/30'}
                  ${isGameRunning ? 'cursor-not-allowed opacity-70' : 'hover:bg-purple-700/80'}`}
              >
                <AnimatePresence>
                {bets[fruit.id] && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full"
                  >
                    {formatNumber(bets[fruit.id])}
                  </motion.div>
                )}
                </AnimatePresence>
                <img src={fruit.image} alt={fruit.name} data-ai-hint={fruit.hint} className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <span className="text-sm font-semibold mt-1 text-yellow-300">x{fruit.multiplier}</span>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full max-w-2xl mt-4 flex flex-col items-center">
        <div className="flex justify-center gap-2 mb-4 w-full">
          {BET_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => !isGameRunning && setSelectedBetAmount(amount)}
              className={`px-4 py-2 text-sm md:text-base font-bold rounded-full transition-all duration-300 border-2
                ${selectedBetAmount === amount ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]' : 'bg-black/30 text-white border-yellow-400/50 hover:bg-black/50'}
                ${isGameRunning ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        {!isGameRunning && Object.keys(bets).length > 0 && (
           <button onClick={startRound} className="w-full max-w-xs py-3 text-lg font-bold rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg hover:scale-105 transition-transform duration-200">
             ابدأ المراهنة
           </button>
        )}
        
        <div className="mt-4 bg-black/30 w-full p-2 rounded-full flex items-center justify-between">
          <span className="text-sm font-bold text-yellow-300 mr-2">التاريخ:</span>
          <div className="flex gap-2 overflow-hidden">
            {history.map((fruit, index) => (
              <div key={index} className="bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center">
                 <img src={fruit.image} alt={fruit.name} data-ai-hint={fruit.hint} className="w-6 h-6" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
