
"use client";

import { useState, useEffect } from 'react';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];

const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'orange', 'lemon', 'grapes', 'cherry', 'timer', 'apple', 'watermelon', 'pear', 'strawberry'
];

const INITIAL_HISTORY: FruitKey[] = ['apple', 'grapes', 'cherry', 'orange', 'watermelon'];


export default function FruityFortunePage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatNumber = (num: number) => {
    if (!isClient) return '...';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
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
          <span className="text-yellow-300 font-bold">الرصيد: {formatNumber(100000000)}</span>
        </div>
      </header>

      <main className="w-full max-w-sm bg-black/20 p-3 rounded-3xl border-2 border-yellow-400/80 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
        <div className="grid grid-cols-3 gap-3">
          {GRID_LAYOUT.map((item, index) => {
            if (item === 'timer') {
              return (
                <div key="timer" className="relative flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border-2 border-yellow-400 shadow-[inset_0_0_15px_rgba(255,215,0,0.5)] aspect-square">
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-white z-0">20</div>
                        <div className="text-sm text-yellow-300 mt-1">وقت الرهان</div>
                    </div>
                </div>
              );
            }
            const fruitKey = item as FruitKey;
            
            return (
              <div key={`${fruitKey}-${index}`} className="relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-100 aspect-square bg-black/30 hover:bg-purple-700/80">
                <FruitDisplay fruitType={fruitKey} size="medium" />
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full max-w-sm mt-4 flex flex-col items-center">
        <div className="flex justify-center gap-1 mb-2 w-full">
          {BET_AMOUNTS.map((amount, index) => (
            <button key={amount} className={`px-3 py-1 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2 ${index === 0 ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]' : 'bg-black/30 text-white border-yellow-400/50 hover:bg-black/50'}`}>
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-yellow-300 ml-2">التاريخ:</span>
          <div className="flex flex-grow justify-around items-center">
            {INITIAL_HISTORY.map((fruitKey, index) => (
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
