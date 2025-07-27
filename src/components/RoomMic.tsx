
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mic, XCircle, Lock, Unlock, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { MicSlotData } from '@/lib/firebaseServices';

interface UserProfile {
    name: string;
    image: string;
    userId: string;
}

interface RoomMicProps {
    slot: MicSlotData;
    index: number;
    isOwner: boolean;
    currentUser: UserProfile;
    onAscend: (index: number) => void;
    onDescend: (index: number) => void;
    onToggleLock: (index: number) => void;
    onToggleMute: () => void;
    onOpenGiftDialog: (recipient: UserProfile | null) => void;
}

export default function RoomMic({
    slot,
    index,
    isOwner,
    currentUser,
    onAscend,
    onDescend,
    onToggleLock,
    onToggleMute,
    onOpenGiftDialog
}: RoomMicProps) {
    const { toast } = useToast();
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

    const isCurrentUserOnThisMic = slot.user?.userId === currentUser.userId;
    const showSpeakingAnimation = !slot.isMuted && isSpeaking;

    const handleCopyUserId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast({ title: "تم نسخ ID المستخدم" });
    };

    const handleInteraction = (action: () => void) => {
        action();
        setIsPopoverOpen(false);
    };

    const popoverContent = (
        <div className="flex flex-col gap-2 p-2">
            {isCurrentUserOnThisMic && slot.user ? (
                <>
                    <Button variant="outline" onClick={() => handleInteraction(onToggleMute)}>
                        {slot.isMuted ? "إلغاء الكتم" : "كتم المايك"}
                    </Button>
                    <Button variant="destructive" onClick={() => handleInteraction(() => onDescend(index))}>النزول من المايك</Button>
                    <Button onClick={() => handleInteraction(() => onOpenGiftDialog(currentUser))}>إرسال هدية</Button>
                </>
            ) : !slot.user ? (
                isOwner ? (
                    slot.isLocked ? (
                        <Button onClick={() => handleInteraction(() => onToggleLock(index))}>فتح المايك <Unlock className="mr-2"/></Button>
                    ) : (
                        <>
                            <Button onClick={() => handleInteraction(() => onAscend(index))}>الصعود على المايك</Button>
                            <Button variant="secondary" onClick={() => handleInteraction(() => onToggleLock(index))}>قفل المايك <Lock className="mr-2"/></Button>
                        </>
                    )
                ) : (
                     <Button onClick={() => handleInteraction(() => onAscend(index))} disabled={slot.isLocked}>الصعود على المايك</Button>
                )
            ) : ( 
               <div className="flex flex-col items-center gap-3 text-center">
                   <Avatar className="w-16 h-16">
                       <AvatarImage src={slot.user.image} alt={slot.user.name} />
                       <AvatarFallback>{slot.user.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <p className="font-bold">{slot.user.name}</p>
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                       <span>ID: {slot.user.userId}</span>
                       <button onClick={() => handleInteraction(() => handleCopyUserId(slot.user!.userId))}>
                           <Copy className="w-3 h-3" />
                       </button>
                   </div>
                   <Button onClick={() => handleInteraction(() => onOpenGiftDialog(slot.user!))}>إرسال هدية</Button>
                   {isOwner && (
                       <Button variant="destructive" size="sm" onClick={() => handleInteraction(() => onDescend(index))}>طرد من المايك</Button>
                   )}
               </div>
            )}
        </div>
    );

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                 <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center relative">
                         {slot.user ? (
                            <div className="relative w-full h-full">
                                <AnimatePresence>
                                    {showSpeakingAnimation && (
                                         <motion.div
                                            className="absolute inset-0 rounded-full border-2 border-yellow-300"
                                            animate={{
                                                scale: [1, 1.3, 1],
                                                opacity: [0.8, 0, 0.8],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={slot.user.image} alt={slot.user.name} />
                                    <AvatarFallback>{slot.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                 {slot.isMuted && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                        <XCircle className="w-6 h-6 text-red-500"/>
                                    </div>
                                )}
                                 {slot.user.userId === room.ownerId && (
                                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-background">
                                        OWNER
                                    </div>
                                )}
                            </div>
                        ) : slot.isLocked ? (
                            <Lock className="w-7 h-7 text-primary/50" />
                        ) : (
                            <Mic className="w-7 h-7 text-primary" />
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-xs text-muted-foreground truncate max-w-16">
                         {slot.user ? slot.user.name : `no.${index + 1}`}
                       </span>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" dir="rtl">
               {popoverContent}
            </PopoverContent>
        </Popover>
    )
}

    