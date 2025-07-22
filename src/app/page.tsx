
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

const BET_AMOUNTS = [1000, 5000, 10000, 50000, 1000000];
const ROUND_DURATION = 20; // seconds
const SPIN_DURATION = 4; // seconds
const TOTAL_DURATION = ROUND_DURATION + SPIN_DURATION;

const FRUIT_KEYS = Object.keys(FRUITS) as FruitKey[];

// This defines the grid layout.
const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'orange', 'cherry', 'watermelon',
    'lemon', 'timer', 'pear',
    'grapes', 'apple', 'strawberry'
];

// This defines the visual, clockwise path for the spinning animation.
const VISUAL_SPIN_ORDER: FruitKey[] = [
    'orange', 'cherry', 'watermelon', 'pear', 'strawberry', 'apple', 'grapes', 'lemon'
];


function formatNumber(num: number) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
}

// Deterministic function to get the winner for a given roundId
function getWinnerForRound(roundId: number): FruitKey {
    // A pseudo-random but deterministic way to select a winner
    // The sequence of winners will always be the same for the same sequence of roundIds
    return FRUIT_KEYS[roundId % FRUIT_KEYS.length];
}

export default function FruityFortunePage() {
  const [isClient, setIsClient] = useState(false);
  const [balance, setBalance] = useState(10000000);
  const [activeBet, setActiveBet] = useState(BET_AMOUNTS[4]);
  
  // Game state driven by time
  const [roundId, setRoundId] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerScreenInfo, setWinnerScreenInfo] = useState<{fruit: FruitKey, payout: number} | null>(null);


  const [history, setHistory] = useState<FruitKey[]>([]);
  const [bets, setBets] = useState<Record<FruitKey, number>>({});
  
  const { toast } = useToast();

  const winnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationSequenceRef = useRef<FruitKey[]>([]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [highlightPosition, setHighlightPosition] = useState<{top: number, left: number, width: number, height: number} | null>(null);


  // Load state from localStorage on initial mount
  useEffect(() => {
    setIsClient(true);
    const savedBalance = localStorage.getItem('fruityFortuneBalance');
    if (savedBalance && !isNaN(parseInt(savedBalance, 10)) && parseInt(savedBalance, 10) > 0) {
        setBalance(parseInt(savedBalance, 10));
    } else {
        setBalance(10000000);
    }

    const savedHistory = localStorage.getItem('fruityFortuneHistory');
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory)) {
                setHistory(parsedHistory);
            }
        } catch (e) {
            setHistory([]);
        }
    }
    
    const savedBets = localStorage.getItem('fruityFortuneBets');
    if (savedBets) {
        try {
            const parsedBets = JSON.parse(savedBets);
            if (typeof parsedBets === 'object' && parsedBets !== null) {
                setBets(parsedBets);
            }
        } catch (e) {
            setBets({});
        }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('fruityFortuneBalance', balance.toString());
      localStorage.setItem('fruityFortuneHistory', JSON.stringify(history));
      localStorage.setItem('fruityFortuneBets', JSON.stringify(bets));
    }
  }, [balance, history, bets, isClient]);

  // The main game loop, driven by a simple interval
  useEffect(() => {
      
      const updateGameState = () => {
          const now = Date.now();
          const currentRoundId = Math.floor(now / (TOTAL_DURATION * 1000));
          const timeInCycle = (now / 1000) % TOTAL_DURATION;

          if (roundId !== currentRoundId) {
            setRoundId(currentRoundId);
          }

          if (timeInCycle < ROUND_DURATION) {
              // Betting phase
              if(isSpinning) { // Process results only once when spinning stops
                if (winnerTimeoutRef.current) {
                  clearTimeout(winnerTimeoutRef.current);
                }
                
                const winner = getWinnerForRound(currentRoundId - 1);
                const payout = (bets[winner] || 0) * FRUITS[winner].multiplier;
          
                if (payout > 0) {
                    setBalance(prev => prev + payout);
                    setWinnerScreenInfo({ fruit: winner, payout: payout });
                    setTimeout(() => setWinnerScreenInfo(null), 3000);
                }
                setHistory(prev => [winner, ...prev.slice(0, 4)]);
                setBets({}); // Clear bets for the new round
                
                winnerTimeoutRef.current = setTimeout(() => {
                    setHighlightPosition(null);
                }, 1000); // Hide highlight after 1 second
              }
              setIsSpinning(false);
              setTimer(ROUND_DURATION - Math.floor(timeInCycle));
               if (!winnerScreenInfo) {
                 setHighlightPosition(null);
               }


          } else {
              // Spinning phase
              if (!isSpinning) {
                if (winnerTimeoutRef.current) {
                  clearTimeout(winnerTimeoutRef.current);
                }

                // Generate animation sequence ONCE at the start of the spin
                const winner = getWinnerForRound(currentRoundId);
                const winnerIndex = VISUAL_SPIN_ORDER.indexOf(winner);
                
                if (winnerIndex === -1) { 
                    animationSequenceRef.current = [winner]; 
                } else {
                    const spins = 3; // How many full loops
                    const totalLength = (VISUAL_SPIN_ORDER.length * spins) + winnerIndex + 1;
    
                    const sequence = Array.from({ length: totalLength }, (_, i) => {
                        return VISUAL_SPIN_ORDER[i % VISUAL_SPIN_ORDER.length];
                    });
                    animationSequenceRef.current = sequence;
                }
              }

              setIsSpinning(true);
              setTimer(0);
              
              const spinTime = timeInCycle - ROUND_DURATION; // time elapsed in spin
              const sequence = animationSequenceRef.current;
              const highlightDuration = SPIN_DURATION / sequence.length;
              const highlightIndex = Math.floor(spinTime / highlightDuration);
              
              const currentFruit = sequence[Math.min(highlightIndex, sequence.length - 1)];

              if (currentFruit) {
                 if (gridRef.current) {
                    const fruitElement = gridRef.current.querySelector(`[data-fruit-id="${currentFruit}"]`) as HTMLElement;
                    if (fruitElement) {
                        setHighlightPosition({
                            top: fruitElement.offsetTop,
                            left: fruitElement.offsetLeft,
                            width: fruitElement.offsetWidth,
                            height: fruitElement.offsetHeight
                        });
                    }
                }
              }
          }
      };

      updateGameState();
      const interval = setInterval(updateGameState, 50); 
      
      return () => {
        clearInterval(interval)
        if (winnerTimeoutRef.current) {
          clearTimeout(winnerTimeoutRef.current);
        }
      };
  }, [isSpinning, bets, roundId, winnerScreenInfo]); 

  const handlePlaceBet = (fruit: FruitKey) => {
    if (isSpinning || timer <= 0) {
      toast({ title: "انتهى وقت الرهان", description: "انتظر حتى الجولة القادمة", variant: "destructive" });
      return;
    }
    if (balance < activeBet) {
       toast({ title: "رصيد غير كاف", description: "ليس لديك ما يكفي من الرصيد للقيام بهذا الرهان", variant: "destructive" });
       return;
    }
    setBalance(prev => prev - activeBet);
    setBets(prev => ({
        ...prev,
        [fruit]: (prev[fruit] || 0) + activeBet
    }));
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
       <AnimatePresence>
        {winnerScreenInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <FruitDisplay fruitType={winnerScreenInfo.fruit} size="large" />
              <h2 className="text-3xl font-bold text-white mt-4">
                ظهرت {FRUITS[winnerScreenInfo.fruit].name}!
              </h2>
              <p className="text-4xl font-bold text-yellow-400 mt-2">
                لقد ربحت {formatNumber(winnerScreenInfo.payout)}!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full max-w-sm flex justify-between items-center mb-4">
        <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-400/50">
          <span className="text-white font-bold">الرصيد: {formatNumber(balance)}</span>
        </div>
        <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-400/50 flex items-center gap-2">
          <span className="text-white font-bold">كروب وائل</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown text-yellow-400"><path d="M13 14.2 15.5 18 l-3.5-1.5 -3.5 1.5 L11 14.2"/><path d="M6 8.2c0-1 1-2 2-2h8c1 0 2 1 2 2v2.4c0 1.4-1.2 2.6-2.6 2.6H8.6C7.2 13.2 6 12 6 10.6V8.2z"/><path d="M6.5 18.2 6 13.2l-3.5 1.5L4 20l4-1.5"/></svg>
        </div>
      </header>

      <main className="w-full max-w-sm bg-black/20 p-3 rounded-3xl border border-yellow-400/30">
        <div className="relative grid grid-cols-3 gap-3" ref={gridRef}>
            <AnimatePresence>
              {highlightPosition && (
                <motion.div
                  className="absolute z-10 rounded-2xl ring-2 ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.7)] pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    top: highlightPosition.top,
                    left: highlightPosition.left,
                    width: highlightPosition.width,
                    height: highlightPosition.height,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 1200, damping: 60, mass: 0.5 }}
                />
              )}
            </AnimatePresence>

          {GRID_LAYOUT.map((item, index) => {
            if (item === 'timer') {
              return (
                <div key="timer" className={cn(
                  "relative flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border-2 border-yellow-400 shadow-[inset_0_0_15px_rgba(255,215,0,0.5)] aspect-square"
                )}>
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-white z-10">{isSpinning ? '...' : (timer > 0 ? timer : 0)}</div>
                        <div className="text-sm text-yellow-300 mt-1">{isSpinning ? 'حظ موفق' : 'وقت الرهان'}</div>
                    </div>
                </div>
              );
            }
            const fruitKey = item as FruitKey;
            
            return (
              <div
                key={`${fruitKey}-${index}`}
                data-fruit-id={fruitKey}
                className={cn(
                    "relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-100 aspect-square bg-black/30",
                     isSpinning && "opacity-60",
                )}
                onClick={() => handlePlaceBet(fruitKey)}
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
        <div className="flex justify-center gap-1 mb-2 w-full">
          {BET_AMOUNTS.map((amount) => (
            <button 
                key={amount} 
                onClick={() => setActiveBet(amount)}
                className={cn(
                    'px-4 py-1.5 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2',
                    activeBet === amount
                        ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]'
                        : 'bg-black/30 text-white border-yellow-400/50'
                )}
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-yellow-300 ml-2">الجولات:</span>
          <div className="flex flex-1 justify-evenly items-center h-10">
            {history.length > 0 ? history.map((fruitKey, index) => (
              <div key={`${fruitKey}-${index}`} className="relative">
                <div className={cn("bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center", index === 0 && "scale-110 border-2 border-yellow-300")}>
                   <FruitDisplay fruitType={fruitKey} size="small" showMultiplier={false} />
                </div>
                {index === 0 && (
                   <div className="absolute -top-3 -right-3 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
                        New
                    </div>
                )}
              </div>
            )) : <span className="text-xs text-gray-400">لا يوجد تاريخ بعد</span>}
             {Array.from({ length: Math.max(0, 5 - history.length) }).map((_, i) => (
                <div key={`placeholder-${i}`} className="w-8 h-8" />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
    

    

    

    

    

    

    

    

    




    

    

    


    



