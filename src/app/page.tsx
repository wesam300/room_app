
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Coins, Flame, Rocket, CircleDashed, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type GameState = 'BETTING' | 'WAITING' | 'LAUNCHED' | 'CRASHED';

const BETTING_TIME = 10; // 10 seconds for betting

export default function CrashGamePage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState(10000);
  const [betAmount, setBetAmount] = useState<number | string>(100);
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(BETTING_TIME);
  const [hasBet, setHasBet] = useState(false);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [rocketPosition, setRocketPosition] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout>();
  const gameLogicRef = useRef<NodeJS.Timeout>();

  const resetGame = useCallback(() => {
    if (gameState === 'CRASHED' && history[history.length - 1] !== crashPoint) {
      setHistory(prev => [...prev.slice(-9), crashPoint].filter(p => p > 0));
    }
    setGameState('BETTING');
    setCountdown(BETTING_TIME);
    setHasBet(false);
    setMultiplier(1.00);
    setRocketPosition(0);
  }, [crashPoint, gameState, history]);

  useEffect(() => {
    if (gameState === 'BETTING') {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setGameState('WAITING');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [gameState]);

  const calculateCrashPoint = () => {
      const e = 2 ** 32;
      const h = crypto.getRandomValues(new Uint32Array(1))[0];
      return Math.floor((100 * e - h) / (e-h)) / 100;
  }

  useEffect(() => {
    if (gameState === 'WAITING') {
      const newCrashPoint = calculateCrashPoint();
      setCrashPoint(newCrashPoint);
      setTimeout(() => {
        setGameState('LAUNCHED');
      }, 1000); // 1s pause before launch
    }
  }, [gameState]);


  useEffect(() => {
    if (gameState === 'LAUNCHED') {
        const startTime = Date.now();
        gameLogicRef.current = setInterval(() => {
            const elapsedTime = (Date.now() - startTime) / 1000;
            const currentMultiplier = Math.max(1, parseFloat(Math.pow(1.05, elapsedTime).toFixed(2)));
            setMultiplier(currentMultiplier);
            setRocketPosition(elapsedTime);

            if (currentMultiplier >= crashPoint) {
                clearInterval(gameLogicRef.current);
                setGameState('CRASHED');
                if(hasBet){
                  toast({
                      title: "💥 تحطم!",
                      description: `لقد تحطم الصاروخ عند x${crashPoint.toFixed(2)}. حظ أوفر في المرة القادمة.`,
                      variant: "destructive",
                  });
                }
            }
        }, 100);
    }
    return () => clearInterval(gameLogicRef.current);
  }, [gameState, crashPoint, hasBet, toast]);
  
  useEffect(() => {
    if (gameState === 'CRASHED') {
      setTimeout(resetGame, 3000);
    }
  }, [gameState, resetGame]);

  const handlePlaceBet = () => {
    const amount = Number(betAmount);
    if (amount <= 0 || amount > balance) {
      toast({ title: "خطأ", description: "مبلغ رهان غير صالح.", variant: "destructive" });
      return;
    }
    setBalance(prev => prev - amount);
    setHasBet(true);
    toast({ title: "تم وضع الرهان!", description: `لقد راهنت بـ ${amount.toLocaleString()} كوينز.` });
  };
  
  const handleCancelBet = () => {
    const amount = Number(betAmount);
    setBalance(prev => prev + amount);
    setHasBet(false);
    toast({ title: "تم إلغاء الرهان", variant: "default" });
  };

  const handleCashOut = () => {
    const amount = Number(betAmount);
    const winnings = amount * multiplier;
    setBalance(prev => prev + winnings);
    setHasBet(false);
    toast({
        title: "🎉 نجاح!",
        description: `لقد سحبت ${winnings.toLocaleString()} كوينز عند x${multiplier.toFixed(2)}!`,
        className: "bg-green-600 border-green-600 text-white"
    });
    // Keep the game running, just disable cashout for this user
  };

  const renderButton = () => {
    if (gameState === 'BETTING') {
      if (hasBet) {
        return <Button onClick={handleCancelBet} variant="destructive" size="lg" className="w-full text-lg font-bold"><X className="mr-2"/>إلغاء</Button>;
      }
      return <Button onClick={handlePlaceBet} disabled={countdown === 0} size="lg" className="w-full text-lg font-bold bg-primary hover:bg-primary/90"><Coins className="mr-2"/>ضع الرهان</Button>;
    }
    if (gameState === 'LAUNCHED' && hasBet) {
      return <Button onClick={handleCashOut} size="lg" className="w-full text-lg font-bold bg-green-500 hover:bg-green-600 text-black">اسحب {(Number(betAmount) * multiplier).toLocaleString(undefined, {maximumFractionDigits: 0})} الآن</Button>;
    }
    return <Button size="lg" disabled className="w-full text-lg font-bold">{gameState === 'WAITING' ? "استعد للإطلاق..." : "انتظر الجولة التالية..."}</Button>
  };

  const rocketY = useMemo(() => {
      const power = 1.8;
      return Math.min(80, rocketPosition * power);
  }, [rocketPosition])

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen p-4 overflow-hidden select-none gradient-background">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      
      <div className="absolute top-4 left-4 z-20">
        <Card className="bg-black/30 backdrop-blur-sm border-white/20">
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
      </div>

      <div className="absolute top-4 right-4 z-20 w-full max-w-md">
         <Card className="bg-black/30 backdrop-blur-sm border-white/20">
            <CardContent className="p-2">
                <p className="text-xs text-muted-foreground mb-1 text-center">الجولات السابقة</p>
                <div className="flex justify-end items-center gap-2">
                    {history.map((h, i) => (
                        <span key={i} className={cn("font-mono text-sm", h < 2 ? "text-red-400" : "text-green-400")}>
                           x{h.toFixed(2)}
                        </span>
                    ))}
                </div>
            </CardContent>
         </Card>
      </div>


      <div className="relative w-full h-[50vh] flex items-center justify-center">
        <AnimatePresence>
          {gameState === 'BETTING' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute z-10 flex flex-col items-center"
            >
              <div className="text-6xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                {countdown}
              </div>
              <p className="text-lg text-muted-foreground">تبدأ الجولة التالية...</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
            {(gameState === 'LAUNCHED' || (gameState === 'CRASHED' && multiplier > 1)) && (
                 <motion.div
                    key="multiplier"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{duration: 0.2}}
                    className="absolute z-10 flex flex-col items-center"
                 >
                    <div className={cn("text-7xl font-bold drop-shadow-lg", gameState === 'CRASHED' ? 'text-red-500' : 'text-white')}>
                        x{multiplier.toFixed(2)}
                    </div>
                 </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
          {(gameState === 'LAUNCHED' || gameState === 'WAITING' || (gameState === 'CRASHED' && rocketPosition > 0)) && (
            <motion.div
              key="rocket"
              initial={{ y: 100, x: "-50%", opacity: 0, scale: 0.5, rotate: -45 }}
              animate={{ y: `-${rocketY}vh`, opacity: 1, scale: 1, rotate: -45 }}
              exit={{ opacity: 0, scale: 2, transition: {duration: 0.5}}}
              className="absolute bottom-0 left-1/2"
            >
              {gameState !== 'CRASHED' ? (
                <div className="relative animate-float">
                  <Rocket size={80} className="text-white -rotate-45 rocket-shadow" />
                  <Flame size={40} className="absolute -bottom-2 -right-2 text-orange-400 rocket-shadow" />
                </div>
              ) : (
                 <motion.div
                    initial={{ scale: 0, opacity: 0}}
                    animate={{ scale: 1, opacity: 1}}
                    transition={{duration: 0.3}}
                 >
                    <div className="text-8xl">💥</div>
                 </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <Card className="w-full max-w-lg bg-black/30 backdrop-blur-sm border-white/20 z-20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">مبلغ الرهان</label>
                <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={hasBet || gameState !== 'BETTING'}
                    className="text-center text-lg h-12"
                    placeholder="100"
                />
            </div>
            <div className="flex flex-col gap-2 justify-end">
                {renderButton()}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
