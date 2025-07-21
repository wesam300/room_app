
"use client";

import { useState, useEffect, useCallback } from 'react';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { cn } from '@/lib/utils';

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'orange', 'lemon', 'grapes', 'cherry', 'timer', 'apple', 'watermelon', 'pear', 'strawberry'
];
const ALL_FRUITS: FruitKey[] = Object.keys(FRUITS) as FruitKey[];

function formatNumber(num: number) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
}

export default function FruityFortunePage() {
  const [isClient, setIsClient] = useState(false);
  const [balance, setBalance] = useState(100000000);
  const [bets, setBets] = useState<Record<FruitKey, number>>({} as Record<FruitKey, number>);
  const [timer, setTimer] = useState(20);
  const [history, setHistory] = useState<FruitKey[]>([]);
  const [activeBet, setActiveBet] = useState(BET_AMOUNTS[0]);
  const [lastWin, setLastWin] = useState<{ fruit: FruitKey; amount: number } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // This effect runs only once on the client-side after the component mounts.
  useEffect(() => {
    setIsClient(true);
    
    const savedBalance = localStorage.getItem('fruityFortuneBalance');
    if (savedBalance) {
        setBalance(parseInt(savedBalance, 10));
    }
    
    // Generate initial history safely on the client
    const initialHistory = Array.from({ length: 5 }, () => ALL_FRUITS[Math.floor(Math.random() * ALL_FRUITS.length)]);
    setHistory(initialHistory);

    setActiveBet(BET_AMOUNTS[0]);
  }, []);

  // Effect to save balance to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('fruityFortuneBalance', balance.toString());
    }
  }, [balance, isClient]);
  
  const handleRoundEnd = useCallback(() => {
    setIsSpinning(true);
    setLastWin(null);

    setTimeout(() => {
        // This logic is now guaranteed to run on the client
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

  // Timer effect, runs only on the client
  useEffect(() => {
    if (!isClient) return;

    if (timer === 3 && !isSpinning) {
      handleRoundEnd();
    }

    const interval = setInterval(() => {
      if (!isSpinning) {
        setTimer(prev => (prev > 0 ? prev - 1 : 0));
      }
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
         <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-1 rounded-full border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="gold" stroke="orange" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="filter drop-shadow-[0_0_3px_gold]"><path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/><path d="M12 15a3 3 0 0 0-3 3c0 .62.18 1.48 1.21 2.52a4 4 0 0 0 3.58 0c1.03-1.04 1.21-1.9 1.21-2.52a3 3 0 0 0-3-3z"/><path d="M12 2v10m-4.5 3.5.07-.07A4.5 4.5 0 0 1 12 13a4.5 4.5 0 0 1 4.43 2.43l.07.07"/></svg>
                <span className="text-yellow-300 font-bold text-sm">كـروب وائـل🤐</span>
            </div>
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
                <div key="timer" className={cn(
                  "relative flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border-2 border-yellow-400 shadow-[inset_0_0_15px_rgba(255,215,0,0.5)] aspect-square",
                  isSpinning && "animate-pulse"
                )}>
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-white z-0">{timer > 3 ? timer - 3 : '...'}</div>
                        <div className="text-sm text-yellow-300 mt-1">{timer > 3 ? 'وقت الرهان' : 'حظ موفق'}</div>
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
                    "relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-100 aspect-square bg-black/30 hover:bg-purple-700/80",
                    isWinning && "bg-yellow-500/50 ring-2 ring-yellow-300 animate-pulse",
                    isSpinning && !isWinning && "opacity-50"
                )}
                onClick={() => placeBet(fruitKey)}
              >
                <FruitDisplay fruitType={fruitKey} size="medium" />
                {bets[fruitKey] > 0 && (
                    <div className="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        {formatNumber(bets[fruitKey])}
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full max-w-sm mt-4 flex flex-col items-center">
        <div className="flex justify-center gap-1 mb-2 w-full">
          {BET_AMOUNTS.map((amount) => (
            <button 
                key={amount} 
                onClick={() => setActiveBet(amount)}
                className={cn(
                    'px-3 py-1 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2',
                    activeBet === amount
                        ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]'
                        : 'bg-black/30 text-white border-yellow-400/50 hover:bg-black/50'
                )}
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-yellow-300 ml-2">التاريخ:</span>
          <div className="flex flex-grow justify-around items-center">
            {history.map((fruitKey, index) => (
              <div key={`${fruitKey}-${index}`} className="bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center">
                 <FruitDisplay fruitType={fruitKey} size="small" showMultiplier={false} />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
