
"use client";

import { useState, useEffect, useCallback } from 'react';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { cn } from '@/lib/utils';

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'watermelon', 'cherry', 'orange', 'pear', 'timer', 'lemon', 'strawberry', 'apple', 'grapes'
];
const ALL_FRUITS: FruitKey[] = Object.keys(FRUITS) as FruitKey[];

function formatNumber(num: number) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
}

export default function FruityFortunePage() {
  const [isClient, setIsClient] = useState(false);
  const [balance, setBalance] = useState(10000000);
  const [bets, setBets] = useState<Record<FruitKey, number>>({} as Record<FruitKey, number>);
  const [timer, setTimer] = useState(20);
  const [history, setHistory] = useState<FruitKey[]>([]);
  const [activeBet, setActiveBet] = useState(BET_AMOUNTS[0]);
  const [lastWin, setLastWin] = useState<{ fruit: FruitKey; amount: number } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Only access localStorage on the client
    const savedBalance = localStorage.getItem('fruityFortuneBalance');
    if (savedBalance) {
        setBalance(parseInt(savedBalance, 10));
    }
    const initialHistory = Array.from({ length: 5 }, () => ALL_FRUITS[Math.floor(Math.random() * ALL_FRUITS.length)]);
    setHistory(initialHistory);
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('fruityFortuneBalance', balance.toString());
    }
  }, [balance, isClient]);
  
  const handleRoundEnd = useCallback(() => {
    setIsSpinning(true);
    setLastWin(null);

    setTimeout(() => {
        const winningFruit = ALL_FRUITS[Math.floor(Math.random() * ALL_FRUITS.length)];
        const payout = (bets[winningFruit] || 0) * FRUITS[winningFruit].multiplier;

        if (payout > 0) {
            setBalance(prev => prev + payout);
            setLastWin({ fruit: winningFruit, amount: payout });
        }

        setHistory(prev => [winningFruit, ...prev.slice(0, 4)]);
        setBets({} as Record<FruitKey, number>);
        setIsSpinning(false);
        setTimer(20);
    }, 3000);
  }, [bets]);

  useEffect(() => {
    if (!isClient || isSpinning) return;

    if (timer === 0) {
      handleRoundEnd();
    }

    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, isClient, isSpinning, handleRoundEnd]);

  const placeBet = (fruit: FruitKey) => {
    if (timer > 3 && balance >= activeBet && !isSpinning) {
      setBalance(prev => prev - activeBet);
      setBets(prev => ({
        ...prev,
        [fruit]: (prev[fruit] || 0) + activeBet,
      }));
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans" dir="rtl">
        <div className="text-2xl font-bold">...تحميل اللعبة</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans overflow-hidden" dir="rtl">
      <header className="w-full max-w-sm flex justify-between items-center mb-4">
        <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-400/50">
          <span className="text-white font-bold">الرصيد: {formatNumber(balance)}</span>
        </div>
        <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-400/50">
          <span className="text-white font-bold">كروب وائل</span>
        </div>
      </header>

      <main className="w-full max-w-sm bg-black/20 p-3 rounded-3xl border border-yellow-400/30">
        <div className="grid grid-cols-3 gap-3">
          {GRID_LAYOUT.map((item, index) => {
            if (item === 'timer') {
              return (
                <div key="timer" className={cn(
                  "relative flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border-2 border-yellow-400 shadow-[inset_0_0_15px_rgba(255,215,0,0.5)] aspect-square",
                   isSpinning && "animate-pulse"
                )}>
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-white z-10">{isSpinning ? '...' : timer}</div>
                        <div className="text-sm text-yellow-300 mt-1">{isSpinning ? 'حظ موفق' : 'وقت الرهان'}</div>
                    </div>
                </div>
              );
            }
            const fruitKey = item as FruitKey;
            const isWinning = lastWin?.fruit === fruitKey;
            
            return (
              <div
                key={`${fruitKey}-${index}`}
                className={cn(
                    "relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-100 aspect-square bg-black/30 hover:bg-purple-700/60",
                    isWinning && "bg-yellow-500/50 ring-2 ring-yellow-300 animate-pulse",
                    isSpinning && !isWinning && "opacity-50"
                )}
                onClick={() => placeBet(fruitKey)}
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
        <div className="flex justify-center gap-1 mb-2 w-full flex-row-reverse">
          {BET_AMOUNTS.map((amount) => (
            <button 
                key={amount} 
                onClick={() => setActiveBet(amount)}
                className={cn(
                    'px-4 py-1.5 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2',
                    activeBet === amount
                        ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]'
                        : 'bg-black/30 text-white border-yellow-400/50 hover:bg-black/50'
                )}
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-yellow-300 ml-2">التاريخ:</span>
          <div className="flex flex-grow justify-around items-center">
            {history.length > 0 ? history.map((fruitKey, index) => (
              <div key={`${fruitKey}-${index}-${Math.random()}`} className="bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center">
                 <FruitDisplay fruitType={fruitKey} size="small" showMultiplier={false} />
              </div>
            )) : <span className="text-xs text-gray-400">لا يوجد تاريخ بعد</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
