
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, XCircle, Lock, Unlock, Copy, Gift, Crown, Star, Medal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { MicSlotData, RoomData, UserData } from '@/lib/firebaseServices';
import { Progress } from '@/components/ui/progress';
import { calculateLevel } from '@/lib/firebaseServices';

interface UserProfile {
    name: string;
    image: string;
    userId: string;
    displayId?: string;
}

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
}

const VipBadge = ({ level }: { level: number }) => {
    const vipLevelDesigns = [
        { name: 'VIP 1', gradient: 'from-gray-500 to-gray-700', textColor: 'text-white' },
        { name: 'VIP 2', gradient: 'from-cyan-500 to-blue-500', textColor: 'text-white' },
        { name: 'VIP 3', gradient: 'from-emerald-500 to-green-600', textColor: 'text-white' },
        { name: 'VIP 4', gradient: 'from-amber-500 to-yellow-600', textColor: 'text-black' },
        { name: 'VIP 5', gradient: 'from-red-500 to-rose-600', textColor: 'text-white' },
        { name: 'VIP 6', gradient: 'from-purple-500 to-violet-600', textColor: 'text-white' },
        { name: 'VIP 7', gradient: 'from-pink-500 to-fuchsia-600', textColor: 'text-white' },
        { name: 'VIP 8', gradient: 'from-slate-800 via-zinc-600 to-slate-800', textColor: 'text-yellow-300' },
        { name: 'VIP 9', gradient: 'from-yellow-400 via-amber-300 to-orange-500', textColor: 'text-black' },
    ];

    if (level < 1 || level > vipLevelDesigns.length) return null;
    const design = vipLevelDesigns[level - 1];

    return (
        <div className={cn("px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 bg-gradient-to-br", design.gradient, design.textColor)}>
             <span>VIP</span>
             <span>{level}</span>
        </div>
    );
};

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
    onOpenGiftDialog
}: RoomMicProps) {
    const { toast } = useToast();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const levelInfo = userData ? calculateLevel(userData.totalSupportGiven) : null;

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

    const handleCopyUserId = (user: UserProfile) => {
        const idToCopy = user.displayId || user.userId;
        navigator.clipboard.writeText(idToCopy);
        toast({ title: "تم نسخ ID المستخدم", duration: 2000 });
        setIsPopoverOpen(false);
    };

    const handleInteraction = (action: () => void) => {
        action();
        setIsPopoverOpen(false);
    };

    const isTargetVip9 = userData?.vipLevel === 9;
    const canKick = isOwner && !isTargetVip9;


    const popoverContent = (
        <div className="flex flex-col gap-2 p-2 w-56">
            {slot.user && userData ? (
                // --- User is on the mic ---
                <div className="flex flex-col items-center gap-3 text-center">
                   <Avatar className="w-20 h-20 border-2 border-primary">
                       <AvatarImage src={slot.user.image} alt={slot.user.name} />
                       <AvatarFallback>{slot.user.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <div className="flex items-center gap-2">
                     <p className="font-bold text-lg">{slot.user.name}</p>
                     {userData.isOfficial && (
                        <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full text-xs font-bold">
                            <Medal className="w-4 h-4" />
                            <span>رسمي</span>
                        </div>
                     )}
                   </div>
                   <div className="flex items-center gap-2">
                        {userData.vipLevel && userData.vipLevel > 0 && <VipBadge level={userData.vipLevel} />}
                        {levelInfo && (
                                <div className="flex items-center justify-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                    <Star className="w-4 h-4 text-yellow-400" />
                                    <span>المستوى {levelInfo.level}</span>
                                </div>
                        )}
                   </div>

                   <button onClick={() => handleCopyUserId(slot.user!)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                       <span>ID: {slot.user.displayId || slot.user.userId}</span>
                       <Copy className="w-3 h-3" />
                   </button>
                   
                   <div className="w-full border-t border-border my-1"></div>

                   {isCurrentUserOnThisMic ? (
                       // Options for myself
                       <div className="w-full grid gap-2">
                           <Button variant="outline" onClick={() => handleInteraction(() => onToggleMute(index))}>
                               {slot.isMuted ? <Mic className="ml-2"/> : <MicOff className="ml-2"/>}
                               {slot.isMuted ? "إلغاء الكتم" : "كتم المايك"}
                           </Button>
                           <Button variant="destructive" onClick={() => handleInteraction(() => onDescend(index))}>النزول من المايك</Button>
                       </div>
                   ) : (
                       // Options for another user
                       <div className="w-full grid gap-2">
                           <Button onClick={() => handleInteraction(() => onOpenGiftDialog(slot.user!))}>
                               <Gift className="w-4 h-4 ml-2" />
                               إرسال هدية
                           </Button>
                           {isOwner && (
                               <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-border">
                                   <Button variant="outline" size="sm" onClick={() => handleInteraction(() => onAdminMute(index))}>
                                       {slot.isMuted ? <Mic className="w-4 h-4"/> : <MicOff className="w-4 h-4"/>}
                                   </Button>
                                   <Button variant="destructive" size="sm" onClick={() => handleInteraction(() => onDescend(index))} disabled={!canKick}>
                                      طرد
                                   </Button>
                               </div>
                           )}
                       </div>
                   )}
               </div>
            ) : (
                // --- Mic is empty ---
                <div className="w-full grid gap-2">
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
               {popoverContent}
            </PopoverContent>
        </Popover>
    )
}

    