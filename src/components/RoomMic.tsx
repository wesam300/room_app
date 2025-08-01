
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, XCircle, Lock, Unlock, Copy, Gift, Crown, Star, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MicSlotData, RoomData, UserData, UserProfile } from '@/lib/firebaseServices';

interface RoomMicProps {
    slot: MicSlotData;
    userData: UserData | null;
    index: number;
    isOwner: boolean;
    currentUser: UserProfile;
    room: RoomData;
    onAscend: (index: number) => void;
    onDescend: (index: number) => void;
    onToggleLock: (index: number) => void;
    onToggleMute: (index: number) => void;
    onAdminMute: (index: number) => void;
    onOpenGiftDialog: (recipient: UserProfile | null) => void;
    children: React.ReactNode; // For the popover content
}

export default function RoomMic({
    slot,
    userData,
    index,
    isOwner,
    currentUser,
    room,
    onAscend,
    onDescend,
    onToggleLock,
    onToggleMute,
    onAdminMute,
    onOpenGiftDialog,
    children
}: RoomMicProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        if (!slot.user || slot.isMuted) {
            setIsSpeaking(false);
            return;
        }

        let speakingTimeout: NodeJS.Timeout;
        const speakingInterval = setInterval(() => {
            const shouldSpeak = Math.random() > 0.7;
            if (shouldSpeak) {
                setIsSpeaking(true);
                speakingTimeout = setTimeout(() => setIsSpeaking(false), 1000 + Math.random() * 1000);
            }
        }, 2000 + Math.random() * 1000);

        return () => {
            clearInterval(speakingInterval);
            clearTimeout(speakingTimeout);
        };
    }, [slot.user, slot.isMuted]);

    const showSpeakingAnimation = !slot.isMuted && isSpeaking;

    const handleInteraction = (action: () => void) => {
        action();
        setIsPopoverOpen(false);
    };

    const emptyMicPopoverContent = (
        <div className="w-full grid gap-2 p-2">
            <Button onClick={() => handleInteraction(() => onAscend(index))} disabled={slot.isLocked}>
                الصعود على المايك
            </Button>
            {isOwner && (
                <Button variant="secondary" onClick={() => handleInteraction(() => onToggleLock(index))}>
                    {slot.isLocked ? <Unlock className="ml-2"/> : <Lock className="ml-2"/>}
                    {slot.isLocked ? "فتح المايك" : "قفل المايك"}
                </Button>
            )}
        </div>
    );

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                 <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center relative">
                         {slot.user ? (
                            <div className="relative w-full h-full">
                                <AnimatePresence>
                                    {showSpeakingAnimation && (
                                         <img 
                                            src="https://i.imgur.com/2xQ3uBZ.jpeg" 
                                            alt="Speaking frame" 
                                            className="absolute -top-2.5 -left-2.5 w-[76px] h-[76px] pointer-events-none"
                                         />
                                    )}
                                </AnimatePresence>
                                <Avatar className="w-full h-full border-2 border-primary">
                                    <AvatarImage src={slot.user.image} alt={slot.user.name} />
                                    <AvatarFallback>{slot.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                 {slot.isMuted && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                        <MicOff className="w-6 h-6 text-white"/>
                                    </div>
                                )}
                                 {slot.user.userId === room.ownerId && (
                                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black p-1 rounded-full border-2 border-background">
                                        <Crown className="w-3 h-3"/>
                                    </div>
                                )}
                            </div>
                        ) : slot.isLocked ? (
                            <Lock className="w-7 h-7 text-primary/50" />
                        ) : (
                            <Mic className="w-7 h-7 text-primary" />
                        )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                       {userData?.isOfficial && (
                           <div className="flex items-center gap-1 text-yellow-500 text-xs">
                                <Medal className="w-3 h-3" />
                           </div>
                       )}
                       <span className={cn(
                           "text-xs text-muted-foreground truncate max-w-16",
                           (userData?.vipLevel ?? 0) >= 8 && "font-bold text-yellow-400"
                       )}>
                         {slot.user ? slot.user.name : `no.${index + 1}`}
                       </span>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" dir="rtl">
               {slot.user ? children : emptyMicPopoverContent}
            </PopoverContent>
        </Popover>
    )
}
