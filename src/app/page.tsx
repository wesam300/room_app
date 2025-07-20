'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, HelpCircle, Volume2 } from "lucide-react";

type GameState = 'betting' | 'waiting' | 'flying' | 'crashed';

const PlayerList = () => {
    const players = [
        { name: 'Player1', avatar: 'https://placehold.co/40x40/7e22ce/ffffff.png', bet: 30000, profit: null, data_ai_hint: 'man portrait' },
        { name: 'Player2', avatar: 'https://placehold.co/40x40/164e63/ffffff.png', bet: 7000, profit: null, data_ai_hint: 'woman portrait' },
        { name: 'Player3', avatar: 'https://placehold.co/40x40/9d174d/ffffff.png', bet: 3000, profit: null, data_ai_hint: 'man face' },
        { name: 'Player4', avatar: 'https://placehold.co/40x40/155e75/ffffff.png', bet: 2000, profit: null, data_ai_hint: 'woman face' },
        { name: 'Player5', avatar: 'https://placehold.co/40x40/6d28d9/ffffff.png', bet: 1000, profit: null, data_ai_hint: 'person' },
    ];

    return (
        <div className="absolute top-28 left-4 w-64 space-y-2">
            <div className="text-center mb-2">
                <p className="text-sm text-gray-400">الرهان للكل</p>
                <p className="text-lg font-bold text-white">43000</p>
            </div>
            {players.map((player, index) => (
                <div key={index} className="flex items-center justify-between text-white text-sm p-1 rounded-lg bg-black/20">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={player.avatar} alt={player.name} data-ai-hint={player.data_ai_hint} />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p>{player.bet.toLocaleString()} الرهان</p>
                            <p className="text-gray-400">-- ربح</p>
                        </div>
                    </div>
                    <Coins className="h-5 w-5 text-yellow-400" />
                </div>
            ))}
        </div>
    );
};

const RocketIcon = ({ crashed }: { crashed: boolean }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={`w-16 h-16 text-white transform -rotate-45 transition-all duration-500 ${crashed ? 'opacity-0' : 'opacity-100'}`}
    >
        <path d="M14.25 2.25a.75.75 0 00-1.5 0v1.01a4.503 4.503 0 00-3.593 4.136c-.02.164-.04.327-.063.49a.75.75 0 001.493.125c.02-.15.038-.3.056-.448a3.004 3.004 0 013.107-2.825V2.25zM8.835 18.062a.75.75 0 00-.75.75v.458c0 .414.336.75.75.75h.415a.75.75 0 000-1.5H8.835z" />
        <path fillRule="evenodd" d="M15.009 6.24a.75.75 0 00-1.018-.043l-5.63 4.07a.75.75 0 00-.261.834l.235.94a.75.75 0 00.94.506l2.94-.734a.75.75 0 01.758.238l4.133 4.822a.75.75 0 001.29-.75l-4.133-4.822a.75.75 0 00-.28-.316l-2.94.735a.75.75 0 01-.94-.507l-.235-.94a.75.75 0 01.26-.833l5.63-4.07a.75.75 0 00.042-1.018z" clipRule="evenodd" />
        <path d="M12 21a.75.75 0 00.75.75h.415a.75.75 0 000-1.5H12.75A.75.75 0 0012 21zM15.165 18.062a.75.75 0 00-.75.75v.458c0 .414.336.75.75.75h.415a.75.75 0 000-1.5h-.415z" />
    </svg>
);


const Sparks = () => (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24">
        {[...Array(10)].map((_, i) => (
            <div
                key={i}
                className="absolute bg-yellow-400 rounded-full"
                style={{
                    width: `${Math.random() * 5 + 2}px`,
                    height: `${Math.random() * 5 + 2}px`,
                    left: `${Math.random() * 100}%`,
                    bottom: `${Math.random() * -20}px`,
                    animation: `particle-up ${Math.random() * 1 + 0.5}s ease-out infinite`
                }}
            />
        ))}
    </div>
);


export default function CrashGamePage() {
    const [gameState, setGameState] = useState<GameState>('betting');
    const [betAmount, setBetAmount] = useState<number>(0);
    const [coins, setCoins] = useState(1000000);
    const [multiplier, setMultiplier] = useState(1.00);
    const [countdown, setCountdown] = useState(10);
    const [cashedOut, setCashedOut] = useState(false);
    
    const countdownRef = useRef<NodeJS.Timeout>();
    const gameLoopRef = useRef<NodeJS.Timeout>();

    const startBettingPhase = useCallback(() => {
        setGameState('betting');
        setMultiplier(1.00);
        setBetAmount(0);
        setCashedOut(false);
        setCountdown(10);
        
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    startWaitingPhase();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const startWaitingPhase = () => {
        setGameState('waiting');
        setCountdown(5); // Show "Starting in 5..."
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    startGameLoop();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };


    const startGameLoop = () => {
        setGameState('flying');
        const crashPoint = Math.random() * 10 + 1.1; // Random crash between 1.1x and 11.1x
        
        const loop = () => {
            setMultiplier(prev => {
                const nextMultiplier = prev + (0.01 + prev / 100);
                if (nextMultiplier >= crashPoint) {
                    setGameState('crashed');
                    if (betAmount > 0 && !cashedOut) {
                         // No coin change, bet is lost
                    }
                    setTimeout(startBettingPhase, 3000); // Restart after 3s
                    return crashPoint;
                }
                gameLoopRef.current = setTimeout(loop, 100);
                return nextMultiplier;
            });
        };
        loop();
    };

    useEffect(() => {
        startBettingPhase();
        return () => {
            clearInterval(countdownRef.current);
            clearTimeout(gameLoopRef.current);
        };
    }, [startBettingPhase]);

    const handlePlaceBet = (amount: number) => {
        if (gameState === 'betting' && coins >= amount) {
            setBetAmount(prev => prev + amount);
            setCoins(prev => prev - amount);
        }
    };

    const handleCashOut = () => {
        if (gameState === 'flying' && betAmount > 0 && !cashedOut) {
            const winnings = betAmount * multiplier;
            setCoins(prev => prev + winnings);
            setCashedOut(true);
        }
    };
    
    const getButtonText = () => {
        if(gameState === 'betting') return `الرهان (${betAmount.toLocaleString()})`;
        if(gameState === 'flying') {
            if (betAmount > 0 && !cashedOut) {
                return `سحب ${(betAmount * multiplier).toFixed(0).toLocaleString()}`;
            }
            return 'في الانتظار';
        }
        if(gameState === 'crashed') return 'تحطم!';
        return 'الرهان';
    }
    
    const isBettingDisabled = gameState !== 'betting';
    const isCashOutDisabled = gameState !== 'flying' || cashedOut || betAmount === 0;

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-screen overflow-hidden font-sans bg-gradient-to-b from-[#1a0c3e] to-[#0f0524]">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-10">
                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg">
                    <Coins className="h-6 w-6 text-yellow-400" />
                    <span className="font-bold text-lg">{coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Volume2 /></Button>
                    <Button variant="ghost" size="icon"><HelpCircle /></Button>
                </div>
            </div>

            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 p-1 px-3 rounded-full text-sm">
                {[1.52, 1.7, 2, 8.93].map((m, i) => (
                    <span key={i} className={m > 2 ? 'text-green-400' : 'text-gray-400'}>{m.toFixed(2)}x</span>
                ))}
                <span>...</span>
            </div>

            <PlayerList />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                    className="absolute w-1 bg-yellow-400/30"
                    style={{ height: '70vh', top: '15vh' }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_15px_5px_rgba(250,204,21,0.5)]"></div>
                </div>
            </div>


            <main className="relative flex-1 flex flex-col items-center justify-center text-white w-full">
                {gameState === 'betting' && (
                     <div className="text-center">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                 <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(0, 255, 255, 0.2)" strokeWidth="6" />
                                 <circle
                                     cx="60"
                                     cy="60"
                                     r="54"
                                     fill="none"
                                     stroke="cyan"
                                     strokeWidth="6"
                                     strokeDasharray={2 * Math.PI * 54}
                                     strokeDashoffset={ (2 * Math.PI * 54) * (1 - countdown / 10)}
                                     className="transition-all duration-1000 linear"
                                     strokeLinecap="round"
                                 />
                             </svg>
                             <div className="absolute flex flex-col items-center">
                                 <p className="text-gray-400 text-sm">تبدأ في</p>
                                 <p className="text-5xl font-bold text-cyan-300">{countdown}</p>
                             </div>
                         </div>
                     </div>
                )}
                 {gameState === 'waiting' && (
                    <div className="flex flex-col items-center text-4xl font-bold">
                        <p>يبدأ الإطلاق في</p>
                        <p className="text-6xl text-yellow-400">{countdown}</p>
                    </div>
                )}

                {gameState === 'flying' && (
                    <div className="text-6xl font-bold text-green-400">
                        {multiplier.toFixed(2)}x
                    </div>
                )}

                {gameState === 'crashed' && (
                     <div className="text-6xl font-bold text-red-500 animate-pulse">
                        تحطم @ {multiplier.toFixed(2)}x
                    </div>
                )}

                <div className="absolute bottom-1/3 transition-transform duration-100" style={{ transform: gameState === 'flying' ? `translateY(-${(multiplier - 1) * 60}px)` : 'translateY(0)' }}>
                   <div className="relative">
                      <RocketIcon crashed={gameState === 'crashed'} />
                      {gameState === 'flying' && <Sparks />}
                   </div>
                </div>


            </main>

            <footer className="w-full max-w-md p-4 z-10">
                <Card className="bg-purple-900/40 border-purple-600/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex flex-col gap-3">
                         <div className="flex justify-around items-center">
                            {[1000, 5000, 10000, 100000].map(amount => (
                                <Button 
                                    key={amount}
                                    onClick={() => handlePlaceBet(amount)}
                                    disabled={isBettingDisabled}
                                    className="bg-blue-800/50 hover:bg-blue-700/70 border border-blue-500 text-white rounded-full transition-all"
                                >
                                    {amount.toLocaleString()}
                                </Button>
                            ))}
                        </div>
                        <Button
                          onClick={gameState === 'flying' ? handleCashOut : () => {}}
                          disabled={isCashOutDisabled && gameState === 'flying'}
                          className={`w-full h-14 text-2xl font-bold rounded-full transition-all duration-300
                            ${gameState === 'betting' && betAmount > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-purple-900' : ''}
                            ${gameState === 'betting' && betAmount === 0 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : ''}
                            ${gameState === 'flying' && betAmount > 0 && !cashedOut ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                            ${gameState === 'flying' && (betAmount === 0 || cashedOut) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : ''}
                            ${gameState === 'crashed' ? 'bg-red-700 text-white cursor-not-allowed' : ''}
                          `}
                        >
                            {getButtonText()}
                        </Button>
                    </CardContent>
                </Card>
            </footer>
        </div>
    );
}
