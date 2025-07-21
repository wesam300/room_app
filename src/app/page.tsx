
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];

const GRID_LAYOUT: (FruitKey | 'timer')[] = [
  'cherry', 'lemon', 'apple',
  'mango', 'timer', 'watermelon',
  'grapes', 'pineapple', 'kiwi'
];

export default function FruityFortunePage() {
  const [balance, setBalance] = useState(10000000);
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState(15);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [winningFruit, setWinningFruit] = useState<FruitKey | null>(null);
  const [history, setHistory] = useState<FruitKey[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);

  const startRound = useCallback(() => {
    const totalBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    if (totalBet === 0) return;
    if (totalBet > balance) return;

    setBalance(prev => prev - totalBet);
    setIsGameRunning(true);
    setWinningFruit(null);
    setLastWinnings(0);
    setTimer(15);
  }, [bets, balance]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (isGameRunning && timer === 0) {
      endRound();
    }
    return () => clearInterval(interval);
  }, [isGameRunning, timer]);

  const endRound = () => {
    const fruitKeys = Object.keys(FRUITS) as FruitKey[];
    const winner = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
    setWinningFruit(winner);

    let winnings = 0;
    if (bets[winner]) {
      winnings = bets[winner] * FRUITS[winner].multiplier;
      setBalance(prev => prev + winnings);
    }
    setLastWinnings(winnings);

    setHistory(prev => [winner, ...prev.slice(0, 9)]);

    setTimeout(() => {
      setIsGameRunning(false);
      setBets({});
      setWinningFruit(null);
      // Reset timer for next round prompt
      setTimer(15);
    }, 5000);
  };

  const placeBet = (fruitId: FruitKey) => {
    if (isGameRunning) return;
    setBets(prev => {
      const newBets = { ...prev };
      newBets[fruitId] = (newBets[fruitId] || 0) + selectedBetAmount;
      return newBets;
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const getTotalBetAmount = () => {
    return Object.values(bets).reduce((sum, amount) => sum + amount, 0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans overflow-hidden" dir="rtl">
      
      <header className="w-full max-w-sm flex justify-between items-center mb-4">
        <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-400/50">
          <span className="text-white font-bold">لعبة الفواكه</span>
        </div>
        <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-400/50">
          <span className="text-yellow-300 font-bold">الرصيد: {formatNumber(balance)}</span>
        </div>
      </header>

      <main className="w-full max-w-sm bg-black/20 p-3 rounded-3xl border-2 border-yellow-400/80 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
        <div className="grid grid-cols-3 gap-3">
          {GRID_LAYOUT.map((item, index) => {
            if (item === 'timer') {
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
                   <div className="flex flex-col items-center justify-center">
                    {isGameRunning ? (
                      <div className="text-5xl font-bold text-white z-0">{timer}</div>
                    ) : (
                      <>
                        <div className="text-5xl">💎</div>
                         {Object.keys(bets).length > 0 && !isGameRunning && (
                            <button onClick={startRound} className="absolute bottom-[-55px] w-40 py-2 text-lg font-bold rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg hover:scale-105 transition-transform duration-200">
                                راهن ({formatNumber(getTotalBetAmount())})
                            </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            }
            const fruitKey = item as FruitKey;
            const fruit = FRUITS[fruitKey];
            const isWinning = winningFruit === fruitKey;
            return (
              <div
                key={fruit.id}
                onClick={() => placeBet(fruitKey)}
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
                <FruitDisplay fruitType={fruitKey} size="medium" />
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full max-w-sm mt-16 flex flex-col items-center">
        <div className="flex justify-center gap-1 mb-2 w-full">
          {BET_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => !isGameRunning && setSelectedBetAmount(amount)}
              className={`px-3 py-1 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2
                ${selectedBetAmount === amount ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]' : 'bg-black/30 text-white border-yellow-400/50 hover:bg-black/50'}
                ${isGameRunning ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between">
          <span className="text-sm font-bold text-yellow-300 ml-2">التاريخ:</span>
          <div className="flex gap-2 overflow-hidden flex-row-reverse">
            {history.map((fruitKey, index) => (
              <div key={index} className="bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center">
                 <FruitDisplay fruitType={fruitKey} size="small" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
