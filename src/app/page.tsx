
"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare, Copy, ChevronLeft, Search, PlusCircle, Mic, Send, MicOff, Trophy, Users, Share2, Power, Volume2, VolumeX, Gift, Gem, Smile, XCircle, Trash2, Lock, Unlock, Crown, X, Medal, LogOut, Settings, Edit, RefreshCw, Signal, Star, Ban, Wrench, Store, KeyRound, ImageIcon, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useRooms, useChatMessages, useRoomSupporters, useGifts, useRoomUsers, useGames, useAppStatus } from "@/hooks/useFirebase";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { motion, AnimatePresence } from "framer-motion";
import FruityFortuneGame from "@/components/FruityFortuneGame";
import CrashGame from "@/components/CrashGame";
import RoomMic from "@/components/RoomMic";
import { RoomData, MicSlotData, roomServices, userServices, UserData, supporterServices, gameServices, DifficultyLevel, GiftItem, giftServices, calculateLevel, LEVEL_THRESHOLDS, gameMetaServices, GameInfo, appStatusServices, UserBetData, uploadImageAndGetUrl, invitationCodeServices, AppStatusData } from "@/lib/firebaseServices";
import { INITIAL_INVITATION_CODES } from '@/lib/invitationCodes';


// --- Types ---
interface UserProfile {
    name: string;
    image: string;
    userId: string;
    displayId?: string;
}

type Room = RoomData;
export type MicSlot = MicSlotData;

interface ChatMessage {
    id: string;
    user: UserProfile;
    text: string;
    createdAt: any;
}

interface Supporter {
    user: UserProfile;
    totalGiftValue: number;
}

interface VipLevel {
    level: number;
    name: string;
    price: number;
    features: string[];
    gradient: string;
    textColor: string;
}


// --- Constants ---
const ADMIN_USER_IDS = ['368473', '607162', '749234', '11196492', '862052'];
const DAILY_REWARD_AMOUNT = 10000000;
const VIP_LEVELS_DATA: VipLevel[] = [
    { level: 1, name: 'VIP 1', price: 15000000, features: ['الحصول على شارة VIP 1 بجانب اسمك في الدردشة والمايك.'], gradient: 'from-gray-500 to-gray-700', textColor: 'text-white' },
    { level: 2, name: 'VIP 2', price: 30000000, features: ['شارة بجانب الاسم في الدردشة والبروفايل', 'مكافآت يومية'], gradient: 'from-cyan-500 to-blue-500', textColor: 'text-white' },
    { level: 3, name: 'VIP 3', price: 60000000, features: ['شارة', 'مكافئات يومية', 'دعم فني متواصل 24 ساعة'], gradient: 'from-emerald-500 to-green-600', textColor: 'text-white' },
    { level: 4, name: 'VIP 4', price: 100000000, features: ['شارة', 'مكافئات يومية', 'دعم فني متواصل 24 ساعة', 'فقاعة دردشة ملونة'], gradient: 'from-amber-500 to-yellow-600', textColor: 'text-black' },
    { level: 5, name: 'VIP 5', price: 200000000, features: ['شارة', 'مكافئات يومية', 'دعم فني متواصل 24 ساعة', 'فقاعة دردشة بلون مختلف', 'ايدي مميز لمدة اسبوع'], gradient: 'from-red-500 to-rose-600', textColor: 'text-white' },
    { level: 6, name: 'VIP 6', price: 400000000, features: ['شارة VIP 6', 'مكافآت يومية مضاعفة', 'دعم فني فوري', 'فقاعة دردشة حصرية', 'ID مميز سداسي مع إمكانية إهدائه', 'زيادة طفيفة في نسبة الربح بالألعاب'], gradient: 'from-purple-500 via-purple-700 to-violet-900', textColor: 'text-white' },
    { level: 7, name: 'VIP 7', price: 700000000, features: ['شارة VIP 7', 'مكافآت يومية من الإدارة', 'دعم فني فوري 24 ساعة', 'فقاعة دردشة حصرية ومميزة', 'ID خماسي مميز مع إمكانية إهداء ID آخر', 'زيادة ملحوظة في نسبة الربح بالألعاب'], gradient: 'from-pink-500 to-fuchsia-600', textColor: 'text-white' },
    { level: 8, name: 'VIP 8', price: 1000000000, features: ['شارة VIP 8', 'مكافآت يومية', 'دعم فني فوري', 'فقاعة دردشة فريدة', 'ID رباعي مميز مع ID سداسي كهدية', 'زيادة فائقة في نسبة الربح', 'اسم لاعب ملون على المايك'], gradient: 'from-slate-800 via-zinc-600 to-slate-800', textColor: 'text-yellow-300' },
    { level: 9, name: 'VIP 9', price: 1500000000, features: ['شارة VIP 9 النهائية', 'مكافأة يومية 50 مليون', 'دعم فني فوري وشخصي', 'فقاعة دردشة ذهبية فريدة', 'ID ثلاثي مميز مع ID خماسي كهدية', 'أعلى نسبة ربح في الألعاب', 'اسم لاعب ذهبي على المايك', 'حصانة من الطرد (من المايك أو الغرفة)'], gradient: 'from-yellow-400 via-amber-300 to-orange-500', textColor: 'text-black' },
];
const GIFT_QUANTITIES = [1, 7, 77, 777, 7777];


function formatNumber(num: number): string {
    if (num >= 1000000) {
        const millions = num / 1000000;
        return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
    }
    if (num >= 1000) {
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands.toFixed(1)}k` : `${thousands.toFixed(1)}k`;
    }
    return num.toLocaleString('en-US');
}

const VipBadge = ({ level }: { level: number }) => {
    if (level === 0) return null;
    const design = VIP_LEVELS_DATA.find(d => d.level === level);
    if (!design) return null;

    return (
        <div className={cn("px-1.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 bg-gradient-to-br", design.gradient, design.textColor)}>
            <span>VIP{level}</span>
        </div>
    );
};

// New Gift Sheet Component
function GiftSheet({
    isOpen,
    onOpenChange,
    usersOnMics,
    onSendGift,
    balance,
    initialRecipient
}: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    usersOnMics: UserProfile[],
    onSendGift: (gift: GiftItem, recipient: UserProfile, quantity: number) => void,
    balance: number,
    initialRecipient: UserProfile | null,
}) {
    const { gifts } = useGifts();
    const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(initialRecipient);
    const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isQuantityPopoverOpen, setIsQuantityPopoverOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialRecipient) {
                setSelectedRecipient(initialRecipient);
            } else if (usersOnMics.length > 0) {
                if (!selectedRecipient) {
                    setSelectedRecipient(usersOnMics[0]);
                }
            }
        }
    }, [isOpen, initialRecipient, usersOnMics, selectedRecipient]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedGift(null);
            setQuantity(1);
            setSelectedRecipient(null);
        }
    }, [isOpen]);

    const handleSendClick = () => {
        if (selectedGift && selectedRecipient) {
            onSendGift(selectedGift, selectedRecipient, quantity);
        }
    };

    const handleSelectQuantity = (q: number) => {
        setQuantity(q);
        setIsQuantityPopoverOpen(false);
    }
    
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="bg-background border-primary/20 rounded-t-2xl h-auto max-h-[70vh] flex flex-col p-0">
                 <SheetHeader className="p-4 text-right">
                    <SheetTitle>إرسال هدية</SheetTitle>
                    <SheetDescription>اختر مستلمًا وهدية لإرسالها.</SheetDescription>
                </SheetHeader>
                <div className="px-4 py-2 shrink-0">
                    <h3 className="text-sm font-semibold mb-2 text-right">إرسال إلى:</h3>
                    {usersOnMics.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {usersOnMics.map(user => (
                                <button
                                    key={user.userId}
                                    onClick={() => setSelectedRecipient(user)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors flex-shrink-0",
                                        selectedRecipient?.userId === user.userId ? "bg-primary/20" : "hover:bg-accent/50"
                                    )}
                                >
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={user.image} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs truncate max-w-16">{user.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground text-sm py-4">لا يوجد مستخدمون على المايك حاليًا.</p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                     <div className="grid grid-cols-3 gap-4">
                        {gifts.map(gift => (
                             <div
                                key={gift.id}
                                onClick={() => setSelectedGift(gift)}
                                className={cn(
                                    "relative aspect-square flex flex-col items-center p-0 rounded-lg bg-cover bg-center cursor-pointer transition-all border-2 overflow-hidden bg-black/30",
                                    selectedGift?.id === gift.id ? "border-primary" : "border-transparent hover:border-primary/50"
                                )}
                            >
                                <img src={gift.image} data-ai-hint="gift present" alt={gift.name} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="absolute bottom-0 left-0 right-0 w-full text-center py-1 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="text-xs font-bold text-white drop-shadow-md">{formatNumber(gift.price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-t border-primary/20 mt-auto shrink-0">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="font-bold text-lg">{formatNumber(balance)}</span>
                    </div>
                    <div className="flex gap-2">
                        <Popover open={isQuantityPopoverOpen} onOpenChange={setIsQuantityPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="font-bold">
                                    x{quantity}
                                    <ChevronUp className="ml-1 h-4 w-4 shrink-0 transition-transform duration-200" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 p-1" dir="rtl">
                                <div className="grid gap-1">
                                    {GIFT_QUANTITIES.map((q) => (
                                        <Button
                                            key={q}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={() => handleSelectQuantity(q)}
                                        >
                                            x{q}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            size="lg"
                            onClick={handleSendClick}
                            disabled={!selectedGift || !selectedRecipient}
                        >
                            إرسال
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// New Game Selection Sheet
function GameSelectionSheet({
    isOpen,
    onOpenChange,
    onSelectGame,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectGame: (gameId: string) => void;
}) {
    const { games } = useGames();

    const handleSelect = (gameId: string) => {
        onSelectGame(gameId);
        onOpenChange(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="bg-background border-primary/20 rounded-t-2xl h-auto">
                <SheetHeader className="p-4 text-center">
                    <SheetTitle>اختر لعبة</SheetTitle>
                </SheetHeader>
                <div className="flex justify-center items-center gap-4 p-4">
                    {games.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => handleSelect(game.id)}
                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-black/30 border border-primary/40 hover:bg-primary/20 transition-colors w-28 h-28"
                        >
                            <img src={game.image} alt={game.name} className="w-12 h-12 rounded-lg object-cover" />
                            <span className="font-semibold text-sm">{game.name}</span>
                        </button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}


function EditRoomDialog({ open, onOpenChange, room, onUpdate }: { open: boolean, onOpenChange: (open: boolean) => void, room: Room | null, onUpdate: (updates: { name: string, description: string, image: string }) => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && room) {
            setName(room.name);
            setDescription(room.description);
            setImagePreview(room.image);
            setImageFile(null);
        }
    }, [open, room]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (room && name.trim()) {
            let imageUrl = room.image;
            if (imageFile) {
                try {
                    imageUrl = await uploadImageAndGetUrl(imageFile, `room_images/${room.id}`);
                } catch (error) {
                    console.error("Error uploading room image:", error);
                    alert("Failed to upload new image. Please try again.");
                    return;
                }
            }
            onUpdate({
                name: name.trim(),
                description: description.trim(),
                image: imageUrl,
            });
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-right">تعديل الغرفة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <button
                        className="flex flex-col items-center gap-4 cursor-pointer group relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={imagePreview ?? undefined} />
                            <AvatarFallback>
                                <Camera className="w-8 h-8" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm text-white">تغيير الصورة</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </button>
                    <Input
                        placeholder="اسم الغرفة"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-right"
                    />
                    <Input
                        placeholder="وصف الغرفة"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-right"
                    />
                </div>
                <Button onClick={handleSubmit}>حفظ التغييرات</Button>
            </DialogContent>
        </Dialog>
    );
}

function RoomScreen({ 
    room, 
    user, 
    onExit, 
    onUserDataUpdate,
    appStatus
}: {
    room: RoomData,
    user: UserData,
    onExit: () => void,
    onUserDataUpdate: (updater: (prev: UserData) => UserData) => void,
    appStatus: AppStatusData | null
}) {
    const { toast } = useToast();
    const [activeGame, setActiveGame] = useState<string | null>(null);
    const [isGameSelectionSheetOpen, setGameSelectionSheetOpen] = useState(false);
    const { games } = useGames();
     
    const myMicIndex = (room.micSlots || []).findIndex(slot => slot.user?.userId === user.profile.userId);
    const isMuted = myMicIndex !== -1 ? room.micSlots[myMicIndex].isMuted : true;
    const isOwner = user.profile.userId === room.ownerId;
     
    const { messages: chatMessages, sendMessage: sendChatMessage } = useChatMessages(room.id);
    const [chatInput, setChatInput] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [isGiftSheetOpen, setIsGiftSheetOpen] = useState(false);
    const [initialRecipientForGift, setInitialRecipientForGift] = useState<UserProfile | null>(null);
    const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState(false);

    const { supporters: roomSupporters } = useRoomSupporters(room.id);
    const totalRoomSupport = roomSupporters.reduce((acc, supporter) => acc + supporter.totalGiftValue, 0);

    const usersOnMics = (room.micSlots || []).map(slot => slot.user).filter((u): u is UserProfile => u !== null);
    
    // --- Data fetching for all active users (on mics and in chat) ---
    const userIdsOnMics = usersOnMics.map(u => u.userId);
    const userIdsInChat = chatMessages.map(msg => msg.user.userId);
    const allUserIdsInRoom = [...new Set([...userIdsOnMics, userIdsInChat.filter(id => id), user.profile.userId].flat())];
    const { users: roomUsersData } = useRoomUsers(allUserIdsInRoom);
    
    // --- Voice Chat Hook ---
    useVoiceChat(
        hasMicPermission && myMicIndex !== -1 ? room.id : null,
        user.profile.userId,
        isMuted
    );

    useEffect(() => {
        const getMicPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            // We don't need to use the stream directly here, just ask for permission
            stream.getTracks().forEach(track => track.stop());
            setHasMicPermission(true);
          } catch (error) {
            console.error('Error accessing microphone:', error);
            setHasMicPermission(false);
            toast({
              variant: 'destructive',
              title: 'صلاحية المايكروفون مرفوضة',
              description: 'يرجى تفعيل صلاحية المايكروفون في المتصفح لاستخدام الدردشة الصوتية.',
              duration: 2000,
            });
          }
        };
        getMicPermission();
    }, [toast]);


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

     const handleCopyRoomId = () => {
        navigator.clipboard.writeText(room.id);
        toast({ title: "تم نسخ ID الغرفة", duration: 2000 });
    };

    const handleUpdateRoomData = async (updates: Partial<RoomData>) => {
        try {
            await roomServices.updateRoomData(room.id, updates);
            toast({ title: "تم تحديث بيانات الغرفة بنجاح!", duration: 2000 });
        } catch (error) {
            console.error("Error updating room data:", error);
            toast({ variant: "destructive", title: "خطأ", description: "لم يتم تحديث الغرفة. حاول مرة أخرى.", duration: 2000});
        }
    };
    
    const handleMicAction = useCallback(async (action: 'ascend' | 'descend' | 'toggle_mute' | 'admin_mute' | 'toggle_lock', index: number) => {
      try {
        await roomServices.updateMicSlot(room.id, user.profile, action, index);
      } catch (error) {
        console.error("Failed to update mic state:", error);
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: (error as Error).message || "فشل تحديث حالة المايك. يرجى المحاولة مرة أخرى.",
          duration: 2000
        });
      }
    }, [room.id, user.profile, toast]);

    
    const handleSendMessage = () => {
        if (chatInput.trim() === "") return;
        sendChatMessage({
            roomId: room.id,
            user: user.profile,
            text: chatInput.trim(),
        });
        setChatInput("");
    };

    const handleSendGift = async (gift: GiftItem, recipient: UserProfile, quantity: number) => {
        const totalCost = gift.price * quantity;
    
        if (user.balance < totalCost) {
            toast({ variant: "destructive", title: "رصيد غير كافٍ!", description: `ليس لديك ما يكفي من العملات لإرسال ${quantity}x ${gift.name}.`, duration: 2000 });
            return;
        }
    
        try {
            await userServices.sendGiftAndUpdateLevels(
                user.profile.userId,
                recipient.userId,
                room.id,
                user.profile,
                gift,
                quantity
            );
    
            toast({ title: "تم إرسال الهدية!", description: `لقد أرسلت ${quantity}x ${gift.name} إلى ${recipient.name}.`, duration: 2000 });
            setIsGiftSheetOpen(false);

        } catch (error) {
            console.error("Error sending gift:", error);
            toast({ variant: "destructive", title: "فشل إرسال الهدية", description: (error as Error).message || "حدث خطأ ما. يرجى المحاولة مرة أخرى.", duration: 2000});
        }
    };


    const handleOpenGiftSheet = (recipient: UserProfile | null) => {
        setInitialRecipientForGift(recipient);
        setIsGiftSheetOpen(true);
    };
    
    const handleHeaderClick = () => {
        if (isOwner) {
            setIsEditRoomOpen(true);
        }
    };

    const handleSelectGame = (gameId: string) => {
        if (gameId === 'fruity_fortune' || gameId === 'crash') {
            setActiveGame(gameId);
        }
    };

    const RoomHeader = () => {
      return (
        <header className="flex items-center justify-between p-3 flex-shrink-0 z-10">
            <button 
                onClick={handleHeaderClick} 
                disabled={!isOwner}
                className={cn(
                    "flex items-center gap-2 p-1.5 rounded-full bg-black/20",
                    isOwner && "cursor-pointer hover:bg-black/40"
                )}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={room.image} alt={room.name} />
                <AvatarFallback>{room.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-bold text-sm">{room.name}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); handleCopyRoomId(); }} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </button>
                  <span className="text-xs text-muted-foreground">{room.id}</span>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-black/20 rounded-full">
                            <X className="w-6 h-6 text-primary" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                هل تريد حقًا مغادرة الغرفة؟
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={onExit}>مغادرة</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </header>
      )
  }

    const LeaderboardMedal = ({ rank }: { rank: number }) => {
        if (rank === 1) return <span role="img" aria-label="Gold Medal" className="text-2xl">🥇</span>;
        if (rank === 2) return <span role="img" aria-label="Silver Medal" className="text-2xl">🥈</span>;
        if (rank === 3) return <span role="img" aria-label="Bronze Medal" className="text-2xl">🥉</span>;
        return <span className="text-sm font-bold w-6 text-center">{rank}</span>;
    };

    return (
         <div className="relative flex flex-col h-screen bg-background text-foreground overflow-hidden">
             <div className="absolute inset-0 bg-cover bg-center z-0">
                <div className="absolute inset-0 bg-black/50"></div>
             </div>
             
             <RoomHeader />
             
             <EditRoomDialog 
                open={isEditRoomOpen}
                onOpenChange={setIsEditRoomOpen}
                room={room}
                onUpdate={handleUpdateRoomData}
             />

             <div className="relative z-10 flex flex-col flex-1 min-h-0">
                <GiftSheet 
                    isOpen={isGiftSheetOpen}
                    onOpenChange={setIsGiftSheetOpen}
                    usersOnMics={usersOnMics}
                    onSendGift={handleSendGift}
                    balance={user.balance}
                    initialRecipient={initialRecipientForGift}
                />
                <GameSelectionSheet
                    isOpen={isGameSelectionSheetOpen}
                    onOpenChange={setGameSelectionSheetOpen}
                    onSelectGame={handleSelectGame}
                />

                <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 mt-2">
                         <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-2 p-1 px-3 rounded-full bg-red-800/50 border border-red-500 cursor-pointer">
                                    <Trophy className="w-5 h-5 text-yellow-400"/>
                                    <span className="font-bold text-sm">{formatNumber(totalRoomSupport)}</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64" dir="rtl">
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-bold text-center">أكبر الداعمين</h4>
                                    <hr className="border-border/50 my-1"/>
                                    {roomSupporters.length === 0 ? (
                                        <p className="text-sm text-center text-muted-foreground py-2">لا يوجد داعمين بعد</p>
                                    ) : (
                                        roomSupporters.map((supporter, index) => supporter && supporter.user && (
                                            <div key={supporter.user.userId} className="flex items-center justify-between gap-3 p-1 rounded-md hover:bg-accent/50">
                                                <div className="flex items-center gap-2">
                                                    <LeaderboardMedal rank={index + 1} />
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={supporter.user.image} alt={supporter.user.name} />
                                                        <AvatarFallback>{supporter.user.name ? supporter.user.name.charAt(0) : '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-semibold truncate">{supporter.user.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-yellow-400">
                                                    <Trophy className="w-4 h-4" />
                                                    <span className="text-xs font-bold">{formatNumber(supporter.totalGiftValue)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary text-sm font-bold">
                                {room.userCount}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-y-2 gap-x-2 p-4">
                        {(room.micSlots || []).slice(0, 15).map((slot, index) => {
                            const userData = slot.user ? roomUsersData.get(slot.user.userId) : null;
                            return (
                                <RoomMic 
                                    key={index}
                                    room={room}
                                    slot={slot} 
                                    userData={userData}
                                    index={index}
                                    isOwner={isOwner}
                                    currentUser={user.profile}
                                    onAscend={() => handleMicAction('ascend', index)}
                                    onDescend={() => handleMicAction('descend', index)}
                                    onToggleLock={() => handleMicAction('toggle_lock', index)}
                                    onToggleMute={() => handleMicAction('toggle_mute', index)}
                                    onAdminMute={() => handleMicAction('admin_mute', index)}
                                    onOpenGiftDialog={handleOpenGiftSheet}
                                />
                            );
                        })}
                    </div>
                </div>

                <AnimatePresence>
                    {activeGame === 'fruity_fortune' && (
                        <motion.div 
                            className="absolute inset-x-0 bottom-0 top-[10%] bg-background z-20 rounded-t-2xl overflow-hidden"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                           <div className="relative h-full w-full">
                               <FruityFortuneGame user={user.profile} balance={user.balance} onBalanceChange={(updater) => onUserDataUpdate(prev => ({...prev, balance: typeof updater === 'function' ? updater(prev.balance) : updater}))} />
                               <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-4 right-4 bg-black/50 rounded-full text-white hover:bg-black/70 z-30"
                                    onClick={() => setActiveGame(null)}
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                           </div>
                        </motion.div>
                    )}
                    {activeGame === 'crash' && (
                        <motion.div
                            className="absolute inset-x-0 bottom-0 top-[10%] bg-background z-20 rounded-t-2xl overflow-hidden"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="relative h-full w-full">
                                <CrashGame 
                                    user={user.profile} 
                                    balance={user.balance} 
                                    onBalanceChange={(updater) => onUserDataUpdate(prev => ({...prev, balance: typeof updater === 'function' ? updater(prev.balance) : updater}))} 
                                    gameInfo={games.find(g => g.id === 'crash') || null}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 bg-black/50 rounded-full text-white hover:bg-black/70 z-30"
                                    onClick={() => setActiveGame(null)}
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-shrink-0 px-4 pb-4">
                    <div 
                        ref={chatContainerRef}
                        className="h-32 overflow-y-auto pr-2 space-y-3 mb-2"
                        style={{ maskImage: 'linear-gradient(to top, black 80%, transparent 100%)' }}
                    >
                        {chatMessages.map(msg => {
                          const chatUserData = msg.user ? roomUsersData.get(msg.user.userId) : null;
                          const vipLevel = chatUserData?.vipLevel ?? 0;
                          
                          return (msg && msg.user && msg.user.name) && (
                            <div key={msg.id} className="flex items-start gap-2.5">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={msg.user.image} />
                                    <AvatarFallback>{msg.user.name ? msg.user.name.charAt(0) : ""}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2">
                                       <span className="text-sm text-muted-foreground">{msg.user.name}</span>
                                       {vipLevel > 0 && <VipBadge level={vipLevel} />}
                                       {chatUserData?.isOfficial && (
                                            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                <Medal className="w-3 h-3" />
                                                <span>رسمي</span>
                                            </div>
                                       )}
                                    </div>
                                    <div className={cn("p-2 rounded-lg rounded-tl-none",
                                        vipLevel >= 9
                                            ? "bg-gradient-to-br from-yellow-400/30 via-amber-300/30 to-orange-500/30 border border-amber-400"
                                        : vipLevel >= 8
                                            ? "bg-gradient-to-br from-slate-800/30 via-zinc-600/30 to-slate-800/30 border border-yellow-300/80"
                                        : vipLevel === 7
                                            ? "bg-gradient-to-br from-pink-500/30 to-fuchsia-600/30 border border-fuchsia-400"
                                        : vipLevel === 6
                                            ? "bg-gradient-to-br from-purple-500/30 via-purple-700/30 to-violet-900/30 border border-purple-400"
                                        : vipLevel === 5 
                                            ? "bg-gradient-to-br from-red-500/30 to-rose-600/30 border border-rose-400"
                                        : vipLevel === 4 
                                            ? "bg-gradient-to-br from-amber-500/30 to-yellow-600/30 border border-amber-400" 
                                            : "bg-primary/20"
                                    )}>
                                        <p className="text-sm text-foreground">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                          )
                        })}
                    </div>

                    <div className="relative flex items-end gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-black/40 border border-primary/50 rounded-full p-1 pr-3">
                            <Input
                                placeholder="اكتب رسالتك..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="flex-grow bg-transparent border-none text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                             <Button size="icon" className="rounded-full bg-primary/80 hover:bg-primary h-10 w-10" onClick={handleSendMessage}>
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/40 rounded-full h-12 w-12"
                            onClick={() => handleOpenGiftSheet(null)}
                        >
                            <Gift className="w-6 h-6 text-primary" />
                        </Button>
                         <div className="relative h-12 w-12">
                            <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute bottom-0 right-0 bg-black/40 rounded-full h-12 w-12"
                                    onClick={() => setGameSelectionSheetOpen(true)}
                                >
                                <Gamepad2 className="w-6 h-6 text-primary" />
                            </Button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditProfileDialog({ user, onUserUpdate, children }: { user: UserProfile, onUserUpdate: (updatedUser: Pick<UserProfile, 'name' | 'image'>) => void, children: React.ReactNode }) {
    const [name, setName] = useState(user.name);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setImagePreview(user.image);
            setImageFile(null);
        }
    }, [isOpen, user.name, user.image]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        let imageUrl = user.image;
        if (imageFile) {
            try {
                imageUrl = await uploadImageAndGetUrl(imageFile, `profile_images/${user.userId}`);
            } catch (error) {
                console.error("Error uploading profile image:", error);
                toast({ variant: "destructive", title: "فشل رفع الصورة", duration: 2000 });
                return;
            }
        }

        const updatedUser = { name, image: imageUrl };
        onUserUpdate(updatedUser);
        toast({ title: "تم تحديث الملف الشخصي!", duration: 2000 });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">تعديل الملف الشخصي</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <div className="flex flex-col items-center gap-4">
                        <button
                            className="relative group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={imagePreview ?? undefined} />
                                <AvatarFallback><User className="w-8 h-8" /></AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <Input
                        id="name"
                        placeholder="أدخل اسمك..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-right"
                    />
                </div>
                <Button onClick={handleSave}>حفظ التغييرات</Button>
            </DialogContent>
        </Dialog>
    );
}


function CoinsScreen({ onBack, balance }: { onBack: () => void, balance: number }) {
    const coinPackages = [
        { usd: "0.99", coins: 4500000, display: "4.5m" },
        { usd: "4.99", coins: 22500000, display: "22.5m" },
        { usd: "9.99", coins: 45000000, display: "45m" },
        { usd: "14.99", coins: 67500000, display: "67.5m" },
        { usd: "49.99", coins: 225000000, display: "225m" },
        { usd: "99.99", coins: 450000000, display: "450m" },
    ];

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <header className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-bold">المحفظة</h2>
                <div></div>
            </header>
            
            <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-4 flex items-center justify-between shadow-lg mb-6 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/checkered-light-emboss.png')] opacity-10"></div>
                <div className="flex items-center gap-4 z-10">
                    <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center border-2 border-white/50">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#FFFFFF"/>
                            <path d="M14.25 7.6198C13.8823 7.2243 13.3855 7.00004 12.8687 7H10.5C9.75416 7 9.14165 7.42633 8.87831 8.04873M14.25 7.6198C14.811 8.13012 15.1119 8.84152 15.0833 9.58333C15.0223 11.1969 13.8471 12.4417 12.4167 12.4167H11.5833C10.1529 12.4417 8.97771 11.1969 8.91667 9.58333C8.88814 8.84152 9.18898 8.13012 9.75 7.6198M14.25 7.6198C14.75 8.13012 15 9 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 9 9.25 8.13012 9.75 7.6198M12 12.5V17M12 7V6M10 17H14" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
                <div className="text-left z-10">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-purple-900">رصيد</p>
                        <RefreshCw className="w-4 h-4 text-purple-900"/>
                    </div>
                    <p className="text-3xl font-extrabold text-purple-900">{balance.toLocaleString('en-US')}</p>
                    <p className="text-xs text-purple-800/80 mt-1">يمكن استخدام الكوينز لارسال الهدايا</p>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-2 text-right">شحن</h3>
                <div className="bg-[#2a2d36] rounded-xl p-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-600/50">
                        <ChevronLeft className="w-5 h-5 transform rotate-180 text-gray-400" />
                        <div className="flex items-center gap-2">
                             <span className="font-semibold text-lg">Google Pay</span>
                             <svg width="24" height="24" viewBox="0 0 512 512" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M144.3 176.4c11.3-13.8 24.3-25.8 38.4-35.8l-23-39.7C137.9 116.2 119.5 133 103.8 152c-15.5 18.8-28.8 40-39.2 62.8l43.2 25c5.3-11.7 11.4-22.6 18.3-32.6-7-10-15-19.4-24.2-28.2l-1-1.6zM368.1 176c-11.3-13.8-24.3-25.8-38.4-35.8l23-39.7c21.8 15.6 40.2 32.4 55.9 51.3 15.5 18.8 28.8 40 39.2 62.8l-43.2 25c-5.3-11.7-11.4-22.6-18.3-32.6-7-10-15-19.4-24.2-28.3v0z"/><path d="M473.4 256c0-118-99.3-214.9-217.4-214.9S38.6 138 38.6 256c0 112.5 89.2 205.3 203.4 213.8v-272.7h-67.4v86.7h-43.1v-86.7h-62.4V213h216.1v43h-216.1v-43h62.4v-43.3h43.1v43.3h67.4V213h43.1v-43h62.4V256H285.1v170.7c111.4-15.3 188.3-110.4 188.3-213.7 0 0 .1 0 .1 0z"/></svg>
                        </div>
                    </div>
                     <div className="mt-4 space-y-3">
                        {coinPackages.map((pkg, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl text-sm">
                                    USD {pkg.usd}
                                </Button>
                                <div className="flex items-center gap-2">
                                     <span className="font-bold text-lg">{pkg.display}</span>
                                     <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#eab308"/>
                                            <path d="M14.25 7.6198C13.8823 7.2243 13.3855 7.00004 12.8687 7H10.5C9.75416 7 9.14165 7.42633 8.87831 8.04873M14.25 7.6198C14.811 8.13012 15.1119 8.84152 15.0833 9.58333C15.0223 11.1969 13.8471 12.4417 12.4167 12.4167H11.5833C10.1529 12.4417 8.97771 11.1969 8.91667 9.58333C8.88814 8.84152 9.18898 8.13012 9.75 7.6198M14.25 7.6198C14.75 8.13012 15 9 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 9 9.25 8.13012 9.75 7.6198M12 12.5V17M12 7V6M10 17H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SilverScreen({ 
    onBack, 
    silverBalance, 
    onConvert
}: { 
    onBack: () => void, 
    silverBalance: number,
    onConvert: () => void
}) {
    const { toast } = useToast();

    const handleConvert = () => {
        if (silverBalance <= 0) {
            toast({ variant: "destructive", title: "ليس لديك فضة", description: "رصيد الفضة لديك هو صفر.", duration: 2000});
            return;
        }
        onConvert();
        toast({ title: "تم الاستبدال بنجاح!", description: `تم تحويل ${silverBalance.toLocaleString()} فضة إلى كوينز.`, duration: 2000 });
    };

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <header className="flex items-center justify-between mb-4">
                 <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-bold">الفضة</h2>
                <div></div>
            </header>
            
            <div className="relative bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg mb-6 overflow-hidden h-56">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-20"></div>
                <div className="z-10">
                    <p className="text-lg font-bold text-gray-200">رصيد الفضة</p>
                    <p className="text-5xl font-extrabold text-white my-2">{silverBalance.toLocaleString('en-US')}</p>
                    <p className="text-xs text-gray-300 max-w-xs mx-auto">يمكنك استبدال الفضة بالكوينز لإنفاقها في التطبيق.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                 <Button size="lg" className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold py-6" onClick={handleConvert}>
                    استبدال بالكوينز
                </Button>
                <p className="text-muted-foreground text-sm mt-4 text-center">
                    سيتم استبدال كل رصيدك من الفضة بالكوينز بنسبة 1:1.
                </p>
            </div>
        </div>
    );
}

function LevelScreen({ onBack, user }: { onBack: () => void, user: UserData }) {
    const { level, progress, currentLevelXp, nextLevelXp } = calculateLevel(user.totalSupportGiven);

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <header className="flex items-center justify-between mb-4">
                 <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-bold">المستوى</h2>
                <div></div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="relative mb-8">
                    <Star className="w-32 h-32 text-yellow-400/20" />
                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-yellow-400">
                        {level}
                    </div>
                </div>

                <h3 className="text-2xl font-bold mb-2">مستواك الحالي: {level}</h3>
                <p className="text-muted-foreground mb-6">
                    استمر في دعم المضيفين للوصول إلى مستويات أعلى!
                </p>

                <div className="w-full max-w-sm bg-black/20 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="font-bold text-primary">المستوى {level}</span>
                        <span className="font-bold text-muted-foreground">المستوى {level + 1}</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="text-center mt-2 text-xs text-muted-foreground">
                        {formatNumber(currentLevelXp)} / {formatNumber(nextLevelXp)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VipScreen({ onBack, onSelectVipLevel }: { onBack: () => void, onSelectVipLevel: (VipLevel) => void }) {
    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <header className="flex items-center justify-between mb-4">
                 <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-bold">VIP Levels</h2>
                <div></div>
            </header>

            <div className="flex-1 grid grid-cols-3 gap-4">
                {VIP_LEVELS_DATA.map((design) => (
                    <button 
                        key={design.level} 
                        onClick={() => onSelectVipLevel(design)}
                        className={cn(
                            "relative flex flex-col items-center justify-center bg-gradient-to-br rounded-2xl w-full aspect-square transition-colors hover:scale-105 overflow-hidden shadow-lg",
                            design.gradient
                        )}
                    >
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className={cn("z-10 text-center", design.textColor)}>
                            <p className="font-black text-2xl tracking-tighter" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>VIP</p>
                            <p className="font-bold text-4xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>{design.level}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function VipGiftingDialog({ open, onOpenChange, onGift }: { open: boolean; onOpenChange: (open: boolean) => void; onGift: (recipientId: string) => void; }) {
    const [recipientId, setRecipientId] = useState("");

    const handleGift = () => {
        if (recipientId.trim()) {
            onGift(recipientId.trim());
            setRecipientId("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-right">إهداء VIP</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-right space-y-2">
                    <p className="text-sm text-muted-foreground">
                        أدخل ID المستخدم الذي تود إهداءه مستوى VIP.
                    </p>
                    <Input
                        placeholder="ID المستخدم"
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        className="text-left"
                    />
                </div>
                <Button onClick={handleGift}>إهداء</Button>
            </DialogContent>
        </Dialog>
    );
}


function VipDetailsSheet({
    isOpen,
    onOpenChange,
    vipLevel,
    user,
    onPurchase,
    onGift,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    vipLevel: VipLevel | null;
    user: UserData;
    onPurchase: (vipLevel: VipLevel) => void;
    onGift: (vipLevel: VipLevel, recipientId: string) => void;
}) {
    const [isGifting, setIsGifting] = useState(false);

    if (!vipLevel) return null;

    const hasVip = user.vipLevel && user.vipLevel >= vipLevel.level;
    const canAfford = user.balance >= vipLevel.price;

    return (
        <>
            <VipGiftingDialog 
                open={isGifting}
                onOpenChange={setIsGifting}
                onGift={(recipientId) => onGift(vipLevel, recipientId)}
            />
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="bg-background border-primary/20 rounded-t-2xl h-auto flex flex-col p-0">
                    <SheetHeader className="p-4 text-center">
                        <div 
                            className={cn(
                                "mx-auto w-40 py-2 rounded-lg text-center my-2 bg-gradient-to-br",
                                vipLevel.gradient,
                                vipLevel.textColor
                            )}
                        >
                             <p className="font-black text-2xl tracking-tighter" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>{vipLevel.name}</p>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4 text-right">
                        <h3 className="font-bold text-lg mb-2">المميزات:</h3>
                        <ul className="space-y-2 list-disc list-inside">
                            {vipLevel.features.map((feature, index) => (
                                <li key={index} className="text-muted-foreground">{feature}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 border-t border-primary/20 mt-auto shrink-0">
                         <div className="flex items-center justify-between mb-4">
                            <span className="font-semibold text-lg">السعر:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-2xl text-yellow-400">{formatNumber(vipLevel.price)}</span>
                                <Gem className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                size="lg" 
                                className="bg-green-600 hover:bg-green-700" 
                                onClick={() => onPurchase(vipLevel)}
                                disabled={hasVip || !canAfford}
                            >
                                {hasVip ? 'تمتلكه بالفعل' : (canAfford ? 'شراء' : 'رصيد غير كافٍ')}
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline"
                                onClick={() => setIsGifting(true)}
                                disabled={!canAfford}
                            >
                                إهداء لصديق
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

function AdminGiftManager() {
    const { gifts } = useGifts();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);

    const handleEditClick = (giftId: string) => {
        setSelectedGiftId(giftId);
        fileInputRef.current?.click();
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && selectedGiftId) {
            try {
                const imageUrl = await uploadImageAndGetUrl(file, `gift_images/${selectedGiftId}`);
                await giftServices.updateGiftImage(selectedGiftId, imageUrl);
                toast({ title: "تم تحديث صورة الهدية بنجاح!", duration: 2000 });
            } catch (error) {
                console.error("Failed to update gift image:", error);
                toast({ variant: "destructive", title: "فشل تحديث الصورة", duration: 2000 });
            } finally {
                setSelectedGiftId(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-2">
            <h4 className="font-semibold">إدارة الهدايا</h4>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
            <div className="grid grid-cols-4 gap-2">
                {gifts.map(gift => (
                    <button
                        key={gift.id}
                        onClick={() => handleEditClick(gift.id)}
                        className="relative aspect-square flex flex-col items-center justify-center p-1 rounded-lg bg-black/30 cursor-pointer transition-all border-2 border-transparent hover:border-primary group"
                    >
                        <img src={gift.image} alt={gift.name} className="w-10 h-10 object-contain" />
                        <span className="text-xs text-muted-foreground mt-1">{gift.name}</span>
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                           <Edit className="w-6 h-6 text-white"/>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

function AdminGameManager() {
    const { games } = useGames();
    const { toast } = useToast();
    const iconFileInputRef = useRef<HTMLInputElement>(null);
    const bgFileInputRef = useRef<HTMLInputElement>(null);
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [uploadType, setUploadType] = useState<'icon' | 'background' | null>(null);

    const handleEditClick = (gameId: string, type: 'icon' | 'background') => {
        setSelectedGameId(gameId);
        setUploadType(type);
        if (type === 'icon') {
            iconFileInputRef.current?.click();
        } else {
            bgFileInputRef.current?.click();
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && selectedGameId && uploadType) {
            try {
                const imageUrl = await uploadImageAndGetUrl(file, `game_assets/${selectedGameId}_${uploadType}`);
                if (uploadType === 'icon') {
                    await gameMetaServices.updateGameImage(selectedGameId, imageUrl);
                    toast({ title: "تم تحديث أيقونة اللعبة بنجاح!", duration: 2000 });
                } else {
                    await gameMetaServices.updateGameBackgroundImage(selectedGameId, imageUrl);
                    toast({ title: "تم تحديث خلفية اللعبة بنجاح!", duration: 2000 });
                }
            } catch (error) {
                console.error(`Failed to update game ${uploadType}:`, error);
                toast({ variant: "destructive", title: "فشل تحديث الصورة", duration: 2000 });
            } finally {
                setSelectedGameId(null);
                setUploadType(null);
                if(event.target) event.target.value = "";
            }
        }
    };

    return (
        <div className="space-y-2">
            <h4 className="font-semibold">إدارة صور الألعاب</h4>
            <input
                type="file"
                ref={iconFileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
            <input
                type="file"
                ref={bgFileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
            <div className="flex gap-4">
                {games.map(game => (
                    <div key={game.id} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-black/30">
                        <div className="relative group">
                            <img src={game.image} alt={game.name} className="w-12 h-12 object-cover rounded-md" />
                            <button
                                onClick={() => handleEditClick(game.id, 'icon')}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                            >
                               <Edit className="w-5 h-5 text-white"/>
                            </button>
                        </div>
                        <span className="text-xs text-muted-foreground">{game.name}</span>
                         <Button variant="outline" size="sm" onClick={() => handleEditClick(game.id, 'background')}>
                            تغيير الخلفية
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AdminProfileButtonsManager({ appStatus }: { appStatus: AppStatusData | null }) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedButtonKey, setSelectedButtonKey] = useState<string | null>(null);

    const buttonKeys = ['level', 'vip', 'store', 'medal'] as const;
    const buttonDefaults = {
        level: { name: 'المستوى', icon: Star },
        vip: { name: 'VIP', icon: Crown },
        store: { name: 'المتجر', icon: Store },
        medal: { name: 'ميدالية', icon: Medal },
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && selectedButtonKey) {
            try {
                const imageUrl = await uploadImageAndGetUrl(file, `profile_buttons/${selectedButtonKey}`);
                await appStatusServices.setProfileButtonImage(selectedButtonKey, imageUrl);
                toast({ title: `تم تحديث صورة زر ${buttonDefaults[selectedButtonKey as keyof typeof buttonDefaults].name} بنجاح!`, duration: 2000 });
            } catch (error) {
                console.error("Failed to update profile button image:", error);
                toast({ variant: "destructive", title: "فشل تحديث الصورة", duration: 2000 });
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = "";
                setSelectedButtonKey(null);
            }
        }
    };

    return (
        <div className="space-y-2">
            <h4 className="font-semibold">إدارة أزرار الملف الشخصي</h4>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
            <div className="grid grid-cols-4 gap-4">
                {buttonKeys.map(key => (
                    <div key={key} className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => {
                                setSelectedButtonKey(key);
                                fileInputRef.current?.click();
                            }}
                            className="relative group w-16 h-16"
                        >
                            <Avatar className="w-full h-full rounded-md">
                                <AvatarImage src={appStatus?.profileButtonImages?.[key] ?? undefined} className="object-cover" />
                                <AvatarFallback className="bg-primary/20 rounded-md">
                                    {React.createElement(buttonDefaults[key].icon, { className: "w-8 h-8 text-primary" })}
                                </AvatarFallback>
                            </Avatar>
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                               <Edit className="w-6 h-6 text-white"/>
                            </div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AdminPanel({ appStatus }: { appStatus: AppStatusData | null }) {
    const { toast } = useToast();
    const [targetUserId, setTargetUserId] = useState("");
    const [newDisplayId, setNewDisplayId] = useState("");
    const [amount, setAmount] = useState("");
    const [checkedUserBalance, setCheckedUserBalance] = useState<number | null>(null);
    const [targetRoomId, setTargetRoomId] = useState("");
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);


    const handleUpdateBalance = async (operation: 'add' | 'deduct') => {
        const numAmount = parseInt(amount, 10);
        if (!targetUserId.trim() || isNaN(numAmount) || numAmount <= 0) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف مستخدم ومبلغ صحيحين.", duration: 2000 });
            return;
        }

        try {
            const amountToUpdate = operation === 'add' ? numAmount : -numAmount;
            await userServices.updateUserBalance(targetUserId, amountToUpdate);
            toast({ title: "تم تحديث الرصيد بنجاح!", description: `تم ${operation === 'add' ? 'إضافة' : 'خصم'} ${numAmount} إلى/من المستخدم ${targetUserId}.`, duration: 2000});
            setTargetUserId("");
            setAmount("");
        } catch (error) {
            console.error("Admin operation failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "لم يتم العثور على المستخدم أو حدث خطأ آخر.", duration: 2000 });
        }
    };

    const handleCheckBalance = async () => {
        if (!targetUserId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف مستخدم.", duration: 2000 });
            return;
        }
        try {
            const user = await userServices.getUser(targetUserId.trim());
            if (user) {
                setCheckedUserBalance(user.balance);
                toast({ title: "تم العثور على المستخدم", description: `رصيد المستخدم ${targetUserId} هو ${user.balance.toLocaleString()}`, duration: 2000 });
            } else {
                setCheckedUserBalance(null);
                toast({ variant: "destructive", title: "لم يتم العثور على المستخدم", description: `لا يوجد مستخدم بالمعرف ${targetUserId}`, duration: 2000 });
            }
        } catch (error) {
            console.error("Admin check balance failed:", error);
            setCheckedUserBalance(null);
            toast({ variant: "destructive", title: "فشلت العملية", description: "حدث خطأ أثناء البحث عن المستخدم.", duration: 2000 });
        }
    };
    
    const handleChangeDisplayId = async () => {
        if (!targetUserId.trim() || !newDisplayId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف المستخدم والمعرف الجديد.", duration: 2000 });
            return;
        }
        try {
            await userServices.changeUserDisplayId(targetUserId.trim(), newDisplayId.trim());
            toast({ title: "تم تغيير معرف العرض بنجاح!", duration: 2000});
            setTargetUserId("");
            setNewDisplayId("");
        } catch (error) {
            console.error("Admin change display ID failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: (error as Error).message || "حدث خطأ ما.", duration: 2000 });
        }
    };

    const handleSetBanStatus = async (isBanned: boolean) => {
        if (!targetUserId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف مستخدم.", duration: 2000 });
            return;
        }
        try {
            await userServices.setUserBanStatus(targetUserId.trim(), isBanned);
            toast({ title: "تم تحديث حالة المستخدم", description: `تم ${isBanned ? 'حظر' : 'رفع الحظر عن'} المستخدم ${targetUserId}.`, duration: 2000 });
        } catch (error) {
            console.error("Admin set ban status failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "حدث خطأ أثناء تحديث حالة المستخدم.", duration: 2000 });
        }
    };

    const handleSetOfficialStatus = async (isOfficial: boolean) => {
        if (!targetUserId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف مستخدم.", duration: 2000 });
            return;
        }
        try {
            await userServices.setUserOfficialStatus(targetUserId.trim(), isOfficial);
            toast({ title: "تم تحديث الحالة الرسمية للمستخدم", description: `تم ${isOfficial ? 'منح' : 'إزالة'} الشارة الرسمية للمستخدم ${targetUserId}.`, duration: 2000 });
        } catch (error) {
            console.error("Admin set official status failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: (error as Error).message || "حدث خطأ أثناء تحديث حالة المستخدم.", duration: 2000 });
        }
    };

    const handleBanRoom = async () => {
        if (!targetRoomId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف غرفة صحيح.", duration: 2000 });
            return;
        }
        try {
            await roomServices.deleteRoom(targetRoomId.trim());
            toast({ title: "تم حذف الغرفة بنجاح!", description: `تم حذف الغرفة بالمعرف ${targetRoomId}.`, duration: 2000});
            setTargetRoomId("");
        } catch (error) {
            console.error("Admin ban room failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: (error as Error).message, duration: 2000 });
        }
    };
    
    const handleSetDifficulty = async (gameId: string, level: DifficultyLevel) => {
        try {
            await gameServices.setGameDifficulty(gameId, level);
            toast({ title: "تم تحديث نسبة الفوز", description: `تم ضبط الصعوبة على: ${level}`, duration: 2000 });
        } catch (error) {
            console.error("Admin set difficulty failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "حدث خطأ أثناء تحديث صعوبة اللعبة.", duration: 2000 });
        }
    };

    const handleMaintenanceMode = async (enable: boolean) => {
        try {
            await appStatusServices.setMaintenanceMode(enable);
            toast({ title: "تم تحديث حالة التطبيق", description: `وضع الصيانة الآن ${enable ? 'مفعل' : 'متوقف'}.`, duration: 2000 });
        } catch (error) {
            console.error("Admin set maintenance mode failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "حدث خطأ أثناء تحديث حالة التطبيق.", duration: 2000 });
        }
    };

    const handleGenerateCode = async () => {
        try {
            const newCodes = await invitationCodeServices.generateInvitationCodes(1);
            if (newCodes.length > 0) {
                setGeneratedCode(newCodes[0]);
                toast({ title: "تم إنشاء كود دعوة جديد", description: "يمكنك نسخه الآن من الأسفل.", duration: 2000 });
            }
        } catch (error) {
            console.error("Admin generate code failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "حدث خطأ أثناء إنشاء الكود.", duration: 2000 });
        }
    };

    const handleCopyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            toast({ title: "تم نسخ الكود بنجاح", duration: 2000 });
        }
    };

    return (
        <div className="mt-8 p-4 bg-black/20 rounded-lg border border-primary/30">
            <h3 className="text-lg font-bold text-center text-primary mb-4">لوحة تحكم المشرف</h3>
            <div className="space-y-4 text-right">
                <div className="space-y-2">
                     <Input
                        placeholder="معرف المستخدم (ID)"
                        value={targetUserId}
                        onChange={(e) => {
                            setTargetUserId(e.target.value);
                            setCheckedUserBalance(null); // Reset on ID change
                        }}
                        className="text-left"
                    />
                     {checkedUserBalance !== null && (
                        <div className="text-center bg-background/50 p-2 rounded-md">
                            <p>رصيد المستخدم المحدد: <span className="font-bold text-primary">{checkedUserBalance.toLocaleString()}</span></p>
                        </div>
                    )}
                    <Button onClick={handleCheckBalance} variant="outline" className="w-full">معرفة الرصيد</Button>
                </div>
                 <hr className="border-primary/20"/>
                 <div className="space-y-2">
                     <h4 className="font-semibold">تعديل الرصيد</h4>
                     <Input
                        type="number"
                        placeholder="المبلغ (للإضافة/الخصم)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-left"
                    />
                    <div className="flex gap-2">
                        <Button onClick={() => handleUpdateBalance('add')} className="w-full">إضافة رصيد</Button>
                        <Button onClick={() => handleUpdateBalance('deduct')} variant="destructive" className="w-full">خصم رصيد</Button>
                    </div>
                </div>
                <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">إدارة المستخدم</h4>
                    <div className="flex gap-2">
                        <Button onClick={() => handleSetBanStatus(true)} variant="destructive" className="w-full">حظر المستخدم</Button>
                        <Button onClick={() => handleSetBanStatus(false)} className="w-full bg-green-600 hover:bg-green-700">رفع الحظر</Button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => handleSetOfficialStatus(true)} className="w-full bg-blue-600 hover:bg-blue-700">جعله رسميًا</Button>
                        <Button onClick={() => handleSetOfficialStatus(false)} variant="outline" className="w-full">إزالة الرسمية</Button>
                    </div>
                </div>
                 <hr className="border-primary/20"/>
                 <div className="space-y-2">
                    <h4 className="font-semibold">تغيير معرف العرض</h4>
                    <Input
                        placeholder="معرف المستخدم الحالي"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        className="text-left"
                    />
                    <Input
                        placeholder="معرف العرض الجديد"
                        value={newDisplayId}
                        onChange={(e) => setNewDisplayId(e.target.value)}
                        className="text-left"
                    />
                    <Button onClick={handleChangeDisplayId} className="w-full">حفظ المعرف الجديد</Button>
                </div>
                 <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">إدارة الغرف</h4>
                    <Input
                        placeholder="معرف الغرفة (ID)"
                        value={targetRoomId}
                        onChange={(e) => setTargetRoomId(e.target.value)}
                        className="text-left"
                    />
                    <Button onClick={handleBanRoom} variant="destructive" className="w-full">حظر الغرفة</Button>
                </div>
                <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">إدارة أكواد الدعوة</h4>
                    <Button onClick={handleGenerateCode} className="w-full">إنشاء كود دعوة جديد</Button>
                    {generatedCode && (
                        <div className="mt-2 p-2 bg-background/50 rounded-md flex items-center justify-between">
                            <span className="font-mono text-primary">{generatedCode}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <hr className="border-primary/20"/>
                <AdminGiftManager />
                <hr className="border-primary/20"/>
                <AdminGameManager />
                <hr className="border-primary/20"/>
                <AdminProfileButtonsManager appStatus={appStatus} />
                <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">التحكم بنسبة الفوز بلعبة كراش</h4>
                    <div className="grid grid-cols-2 gap-2">
                         <Button onClick={() => handleSetDifficulty('crash', 'very_easy')} variant="outline">سهل جدا</Button>
                         <Button onClick={() => handleSetDifficulty('crash', 'easy')} variant="outline">سهل</Button>
                         <Button onClick={() => handleSetDifficulty('crash', 'medium')} variant="outline">متوسط</Button>
                         <Button onClick={() => handleSetDifficulty('crash', 'medium_hard')} variant="outline">اكثر من المتوسط</Button>
                         <Button onClick={() => handleSetDifficulty('crash', 'hard')} variant="outline">صعب</Button>
                         <Button onClick={() => handleSetDifficulty('crash', 'very_hard')} variant="outline">صعب جدا</Button>
                         <Button onClick={() => handleSetDifficulty('crash', 'impossible')} variant="destructive" className="col-span-2">لا أحد يفوز</Button>
                    </div>
                </div>
                <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">التحكم بنسبة الفوز بلعبة الفواكه</h4>
                    <div className="grid grid-cols-2 gap-2">
                         <Button onClick={() => handleSetDifficulty('fruity_fortune', 'very_easy')} variant="outline">سهل جدا</Button>
                         <Button onClick={() => handleSetDifficulty('fruity_fortune', 'easy')} variant="outline">سهل</Button>
                         <Button onClick={() => handleSetDifficulty('fruity_fortune', 'medium')} variant="outline">متوسط</Button>
                         <Button onClick={() => handleSetDifficulty('fruity_fortune', 'medium_hard')} variant="outline">اكثر من المتوسط</Button>
                         <Button onClick={() => handleSetDifficulty('fruity_fortune', 'hard')} variant="outline">صعب</Button>
                         <Button onClick={() => handleSetDifficulty('fruity_fortune', 'very_hard')} variant="outline">صعب جدا</Button>
                         <Button onClick={() => handleSetDifficulty('fruity_fortune', 'impossible')} variant="destructive" className="col-span-2">لا أحد يفوز</Button>
                    </div>
                </div>
                <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">إدارة حالة التطبيق</h4>
                    <div className="flex gap-2">
                        <Button onClick={() => handleMaintenanceMode(true)} variant="destructive" className="w-full">تفعيل وضع الصيانة</Button>
                        <Button onClick={() => handleMaintenanceMode(false)} className="w-full bg-green-600 hover:bg-green-700">إيقاف وضع الصيانة</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


function ProfileScreen({ 
    user, 
    onUserUpdate, 
    onNavigate,
    onLogout,
    appStatus,
}: { 
    user: UserData, 
    onUserUpdate: (updatedUser: Pick<UserProfile, 'name' | 'image'>) => void, 
    onNavigate: (view: 'coins' | 'silver' | 'level' | 'vipLevels' | 'leaderboard') => void,
    onLogout: () => void,
    appStatus: AppStatusData | null,
}) {
    const { toast } = useToast();
    const isAdmin = ADMIN_USER_IDS.includes(user.profile.userId);

    const handleCopyId = () => {
        const idToCopy = user.profile.displayId || user.profile.userId;
        navigator.clipboard.writeText(idToCopy);
        toast({ title: "تم نسخ ID المستخدم", duration: 2000 });
    };

    const buttonKeys = ['level', 'vip', 'store', 'medal'] as const;
    const buttonDefaults = {
        level: { name: 'المستوى', icon: Star, action: () => onNavigate('level') },
        vip: { name: 'VIP', icon: Crown, action: () => onNavigate('vipLevels') },
        store: { name: 'المتجر', icon: Store, action: () => {} },
        medal: { name: 'ميدالية', icon: Medal, action: () => {} },
    };

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
             <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <Avatar className="w-14 h-14">
                        <AvatarImage src={user.profile.image} alt={user.profile.name} />
                        <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                        <h2 className="text-lg font-bold">{user.profile.name}</h2>
                        <button onClick={handleCopyId} className="flex items-center gap-1 text-sm text-muted-foreground w-full justify-start">
                            <Copy className="w-3 h-3" />
                            <span>ID: {user.profile.displayId || user.profile.userId}</span>
                        </button>
                    </div>
                </div>
                <EditProfileDialog user={user.profile} onUserUpdate={onUserUpdate}>
                    <Button variant="ghost" size="icon">
                        <Edit className="w-5 h-5" />
                    </Button>
                </EditProfileDialog>
             </div>

            <div className="mt-6 flex-1 flex flex-col">
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                        className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/10 p-3 rounded-2xl flex flex-col text-center"
                        onClick={() => onNavigate('coins')}
                    >
                        <span className="font-bold text-2xl text-yellow-300">{formatNumber(user.balance)}</span>
                        <span className="text-xs text-yellow-200/80">الكوينز</span>
                    </button>
                    <button 
                        className="bg-gradient-to-br from-gray-400/20 to-gray-600/10 p-3 rounded-2xl flex flex-col text-center"
                        onClick={() => onNavigate('silver')}
                    >
                        <span className="font-bold text-2xl text-gray-300">{formatNumber(user.silverBalance)}</span>
                        <span className="text-xs text-gray-200/80">الفضة</span>
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                     {buttonKeys.map(key => (
                        <div key={key} className="flex flex-col items-center gap-1.5">
                             <button 
                                onClick={buttonDefaults[key].action} 
                                className="flex flex-col items-center justify-center bg-black/20 rounded-2xl w-full aspect-square transition-colors hover:bg-primary/10 overflow-hidden"
                             >
                                {appStatus?.profileButtonImages?.[key] ? (
                                    <img src={appStatus.profileButtonImages[key]} alt={key} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {React.createElement(buttonDefaults[key].icon, { className: "w-8 h-8 text-primary" })}
                                    </div>
                                )}
                            </button>
                            <span className="text-xs text-muted-foreground font-semibold">{buttonDefaults[key].name}</span>
                        </div>
                    ))}
                </div>
            </div>


            {isAdmin && <AdminPanel appStatus={appStatus} />}
            <Button onClick={onLogout} variant="destructive" className="mt-auto">تسجيل الخروج</Button>

        </div>
    );
}

function CreateRoomDialog({ open, onOpenChange, onCreateRoom }: { open: boolean, onOpenChange: (open: boolean) => void, onCreateRoom: (name: string, description: string, imageFile: File | null) => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (name.trim()) {
            onCreateRoom(name.trim(), description.trim(), imageFile);
            // Reset state
            setName('');
            setDescription('');
            setImagePreview(null);
            setImageFile(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-right">إنشاء غرفة جديدة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <button
                        className="flex flex-col items-center gap-4 cursor-pointer group relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={imagePreview ?? undefined} />
                            <AvatarFallback>
                                <Camera className="w-8 h-8" />
                            </AvatarFallback>
                        </Avatar>
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm text-white">اختر صورة</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </button>
                    <Input 
                        placeholder="اسم الغرفة" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="text-right"
                    />
                    <Input 
                        placeholder="وصف الغرفة" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-right"
                    />
                </div>
                <Button onClick={handleSubmit}>إنشاء</Button>
            </DialogContent>
        </Dialog>
    );
}


function RoomsListScreen({ onEnterRoom, onCreateRoom, user, onNavigate }: { onEnterRoom: (Room) => void, onCreateRoom: (roomData: Omit<RoomData, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'micSlots' | 'isRoomMuted'>) => void, user: UserProfile, onNavigate: (view: 'leaderboard') => void }) {
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { rooms, loading: roomsLoading, error: roomsError } = useRooms();

    const handleCreateRoom = async (name: string, description: string, imageFile: File | null) => {
        try {
            let imageUrl = 'https://placehold.co/150x150/673ab7/ffffff.png';
            if (imageFile) {
                // The room ID isn't known yet, so we'll upload to a temp-like path, or let the service handle it
                // For simplicity, we can pass the file and let the service create the ID and then name the file.
                // This requires a change in the service layer.
                // Or, generate a temp client-side ID for the image path.
                const tempId = `temp_${Date.now()}`;
                imageUrl = await uploadImageAndGetUrl(imageFile, `room_images/${tempId}`);
            }

            const newRoomData = {
                name,
                description,
                ownerId: user.userId,
                image: imageUrl,
            };

            await onCreateRoom(newRoomData);
            toast({ title: "تم إنشاء الغرفة بنجاح!", duration: 2000 });
        } catch (error) {
            console.error('Error creating room in RoomsListScreen:', error);
            toast({ 
                variant: "destructive",
                title: "خطأ في إنشاء الغرفة", 
                description: "يرجى المحاولة مرة أخرى.",
                duration: 2000
            });
        }
    };
    
    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
        room.id.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <div className="mb-4">
                <button
                    onClick={() => onNavigate('leaderboard')}
                    className="relative w-full h-32 bg-gradient-to-br from-black/20 to-yellow-900/40 rounded-2xl border-2 border-yellow-500/50 flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer group"
                >
                    <Trophy className="absolute w-40 h-40 text-yellow-400/10 -rotate-12 -left-4 top-4 group-hover:scale-110 transition-transform duration-300" />
                    <div className="z-10 text-center">
                        <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-lg mx-auto mb-1" />
                        <h2 className="text-3xl font-black tracking-tighter">التوب</h2>
                        <p className="text-xs text-yellow-200/80">قوائم الصدارة</p>
                    </div>
                </button>
            </div>
            <header className="flex items-center justify-between mb-4 gap-2">
                <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                     <Input 
                        placeholder="ابحث بالاسم أو الـ ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black/30 border-primary/20 pl-10 text-right"
                    />
                </div>
                <Button variant="outline" size="icon" onClick={() => setIsCreateRoomOpen(true)}><PlusCircle className="w-5 h-5"/></Button>
            </header>
            <CreateRoomDialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen} onCreateRoom={handleCreateRoom} />
             {roomsLoading ? (
                <div className="text-center text-muted-foreground mt-20">
                   <p>...جاري تحميل الغرف</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {filteredRooms.length === 0 ? (
                         <div className="text-center text-muted-foreground mt-20">
                            <p>{searchQuery ? "لا توجد نتائج مطابقة لبحثك." : "لا توجد غرف متاحة حالياً."}</p>
                            {!searchQuery && <p>انقر على علامة + لإنشاء غرفة جديدة!</p>}
                        </div>
                    ) : filteredRooms.map(room => (
                        <div 
                            key={room.id} 
                            onClick={() => onEnterRoom(room)} 
                            className="bg-gradient-to-l from-yellow-900/20 via-yellow-600/20 to-yellow-900/20 p-0.5 rounded-2xl cursor-pointer"
                        >
                            <div className="bg-[#412c1c] rounded-2xl p-3 flex items-center gap-4">
                                <div className="relative flex-shrink-0">
                                    <img src={room.image} data-ai-hint="room entrance" alt={room.name} className="w-20 h-20 rounded-lg object-cover" />
                                    <div className="absolute -top-2 -left-2 bg-black/50 border border-yellow-500 rounded-md px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                                        <Signal className="w-3 h-3 text-green-400" />
                                        <span>{room.userCount}</span>
                                    </div>
                                </div>
                                <div className="flex-1 text-right overflow-hidden">
                                    <h2 className="font-bold text-lg text-white truncate">{room.name}</h2>
                                    <p className="text-sm text-gray-300 truncate">{room.description}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className="text-xs text-gray-400">ID: {room.id}</span>
                                        <Trophy className="w-3 h-3 text-yellow-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function EventsScreen({ onClaimReward, canClaim, timeUntilNextClaim }: { onClaimReward: () => void, canClaim: boolean, timeUntilNextClaim: string }) {
    const { toast } = useToast();

    const handleClaimClick = () => {
        if (canClaim) {
            onClaimReward();
            toast({
                title: "🎉 مبروك! 🎉",
                description: `لقد استلمت ${formatNumber(DAILY_REWARD_AMOUNT)} كوينز!`,
                duration: 2000
            });
        } else {
            toast({
                variant: "destructive",
                title: "لا يمكنك الاستلام الآن",
                description: "لقد استلمت جائزتك اليومية بالفعل.",
                duration: 2000
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-4">
            <h1 className="text-4xl font-bold mb-4 animate-pulse">الأحداث</h1>
            <p className="text-lg mb-8">استلم جائزتك اليومية!</p>
            <Button 
                onClick={handleClaimClick}
                disabled={!canClaim}
                size="lg"
                className={cn(
                    "text-black font-bold text-xl py-8 px-12 rounded-2xl shadow-lg transition-all transform hover:scale-105",
                    canClaim ? "bg-yellow-400 hover:bg-yellow-500" : "bg-gray-500 cursor-not-allowed"
                )}
            >
                {canClaim ? `استلم ${formatNumber(DAILY_REWARD_AMOUNT)}` : `الاستلام القادم بعد: ${timeUntilNextClaim}`}
            </Button>
        </div>
    );
}

function TopSupportersScreen({ onBack }: { onBack: () => void }) {
    const [topSupporters, setTopSupporters] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'wealth' | 'charisma'>('wealth');

    useEffect(() => {
        const fetchSupporters = async () => {
            setLoading(true);
            try {
                const supporters = await supporterServices.getGlobalTopSupporters(30);
                setTopSupporters(supporters);
            } catch (error) {
                console.error("Failed to fetch top supporters:", error);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'wealth') {
            fetchSupporters();
        } else {
            setTopSupporters([]); // Clear for other tabs for now
        }
    }, [activeTab]);

    const TopPlayerCard = ({ user, rank }: { user: UserData, rank: number }) => {
        const styles = {
            1: { container: "row-start-1 col-start-2 z-10 scale-110 pt-4", crown: <Crown className="w-8 h-8 text-yellow-400" />, border: "border-yellow-400" },
            2: { container: "row-start-2 col-start-3 mt-8", crown: <Crown className="w-6 h-6 text-gray-300" />, border: "border-gray-300" },
            3: { container: "row-start-2 col-start-1 mt-8", crown: <Crown className="w-6 h-6 text-amber-600" />, border: "border-amber-600" }
        };
        const style = styles[rank as keyof typeof styles];

        return (
            <div className={cn("flex flex-col items-center gap-1", style.container)}>
                <div className="relative">
                    <Avatar className={cn("w-20 h-20 border-4", style.border)}>
                        <AvatarImage src={user.profile.image} alt={user.profile.name} />
                        <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">{style.crown}</div>
                </div>
                <p className="font-bold text-white text-sm truncate max-w-24">{user.profile.name}</p>
                <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <p className="font-bold text-yellow-300 text-xs">{formatNumber(user.totalSupportGiven)}</p>
                </div>
            </div>
        );
    };

    const topThree = topSupporters.slice(0, 3);
    const rest = topSupporters.slice(3);

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#4a2e05] via-[#2d1c03] to-background text-white">
            <header className="flex-shrink-0 p-4">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronLeft />
                    </Button>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('wealth')} className={cn("text-lg font-bold", activeTab !== 'wealth' && 'text-white/50')}>الثروة</button>
                        <button onClick={() => setActiveTab('charisma')} className={cn("text-lg font-bold", activeTab !== 'charisma' && 'text-white/50')}>الجاذبية</button>
                    </div>
                    <div></div>
                </div>
                 <div className="flex justify-center">
                    <div className="bg-black/30 p-1 rounded-full flex gap-1">
                        <Button variant="ghost" className="rounded-full bg-primary/20 text-white">أسبوعية</Button>
                        <Button variant="ghost" className="rounded-full text-white/70">شهرية</Button>
                    </div>
                 </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="text-center text-muted-foreground mt-20">
                       <p>...جاري تحميل قائمة الصدارة</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 grid-rows-2 items-end h-56 mb-8">
                            {topThree[1] && <TopPlayerCard user={topThree[1]} rank={2} />}
                            {topThree[0] && <TopPlayerCard user={topThree[0]} rank={1} />}
                            {topThree[2] && <TopPlayerCard user={topThree[2]} rank={3} />}
                        </div>
                        
                        <div className="space-y-3">
                            {rest.map((user, index) => (
                                <div key={user.profile.userId} className="flex items-center bg-black/20 p-2 rounded-lg">
                                    <span className="w-8 text-center font-bold text-lg text-muted-foreground">{index + 4}</span>
                                    <Avatar className="w-12 h-12 ml-3">
                                        <AvatarImage src={user.profile.image} alt={user.profile.name}/>
                                        <AvatarFallback>{user.profile.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-white truncate">{user.profile.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {user.vipLevel && user.vipLevel > 0 && <VipBadge level={user.vipLevel} />}
                                            <div className="flex items-center justify-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                                <Star className="w-3 h-3 text-yellow-400" />
                                                <span>{calculateLevel(user.totalSupportGiven).level}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        <span className="font-bold text-yellow-300 text-sm">{formatNumber(user.totalSupportGiven)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function MainApp({ 
    user, 
    onUserDataUpdate,
    onLogout,
    appStatus,
}: { 
    user: UserData, 
    onUserDataUpdate: (updater: (data: UserData) => UserData) => void
    onLogout: () => void,
    appStatus: AppStatusData | null,
}) {
    const [view, setView] = useState<'roomsList' | 'inRoom' | 'profile' | 'events' | 'leaderboard'>('roomsList');
    const [profileView, setProfileView] = useState<'profile' | 'coins' | 'silver' | 'level' | 'vipLevels'>('profile');
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [isJoiningRoom, setIsJoiningRoom] = useState(false);
    const [canClaim, setCanClaim] = useState(false);
    const [timeUntilNextClaim, setTimeUntilNextClaim] = useState('');
    const { createRoom } = useRooms();
    const { toast } = useToast();
    const [selectedVipLevel, setSelectedVipLevel] = useState<VipLevel | null>(null);

    useEffect(() => {
        if (!currentRoom) return;
        const unsubscribe = roomServices.onRoomsChange((rooms) => {
            const updatedRoom = rooms.find(r => r.id === currentRoom.id);
            if (updatedRoom) {
                setCurrentRoom(updatedRoom);
            } else {
                // Room might have been deleted
                setView('roomsList');
                setCurrentRoom(null);
                toast({ variant: "destructive", title: "تم حذف الغرفة", description: "تم حذف الغرفة من قبل المشرف.", duration: 2000})
            }
        });
        return () => unsubscribe();
    }, [currentRoom?.id, toast]);
    
    useEffect(() => {
        const updateClaimTimer = () => {
            const now = new Date();
            const iraqTimezoneOffset = 3 * 60;
            const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
            const nowIraq = new Date(nowUtc + (iraqTimezoneOffset * 60 * 1000));

            const nextClaimDate = new Date(nowIraq);
            nextClaimDate.setHours(24, 0, 0, 0);

            if (user.lastClaimTimestamp) {
                const lastClaimDate = new Date(user.lastClaimTimestamp);
                const lastClaimUtc = lastClaimDate.getTime() + (lastClaimDate.getTimezoneOffset() * 60 * 1000);
                const lastClaimIraq = new Date(lastClaimUtc + (iraqTimezoneOffset * 60 * 1000));

                if (lastClaimIraq.getFullYear() === nowIraq.getFullYear() &&
                    lastClaimIraq.getMonth() === nowIraq.getMonth() &&
                    lastClaimIraq.getDate() === nowIraq.getDate()) {
                    setCanClaim(false);
                    const diff = nextClaimDate.getTime() - nowIraq.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeUntilNextClaim(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                    return;
                }
            }
            setCanClaim(true);
            setTimeUntilNextClaim('جاهزة للاستلام!');
        };
        updateClaimTimer();
        const interval = setInterval(updateClaimTimer, 1000);
        return () => clearInterval(interval);
    }, [user.lastClaimTimestamp]);

    const handleEnterRoom = async (room: Room) => {
        setIsJoiningRoom(true);
        try {
            await roomServices.joinRoom(room.id, user.profile.userId);
            const freshRoomData = await roomServices.getRoom(room.id); 
            if (freshRoomData) {
                setCurrentRoom(freshRoomData);
                setView('inRoom');
            } else {
                 console.error("Failed to fetch fresh room data for room:", room.id);
                 toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على الغرفة.", duration: 2000});
            }
        } catch (error) {
            console.error("Error joining room:", error);
            toast({ variant: "destructive", title: "خطأ", description: "فشل الانضمام للغرفة.", duration: 2000});
        } finally {
            setIsJoiningRoom(false);
        }
    }

    const handleExitRoom = async () => {
        if (currentRoom) {
            try {
                const myCurrentMicIndex = (currentRoom.micSlots || []).findIndex(slot => slot.user?.userId === user.profile.userId);
                if(myCurrentMicIndex !== -1) {
                    await roomServices.updateMicSlot(currentRoom.id, user.profile, 'descend', myCurrentMicIndex);
                }
                await roomServices.leaveRoom(currentRoom.id, user.profile.userId);
            } catch (error) {
                console.error("Error leaving room:", error);
            }
        }
        setCurrentRoom(null);
        setView('roomsList');
    }
    
    const handleUserUpdate = (updatedProfile: Pick<UserProfile, 'name' | 'image'>) => {
        onUserDataUpdate(prev => ({ ...prev, profile: { ...prev.profile, ...updatedProfile } }));
    };

    const handleConvertSilver = () => {
        onUserDataUpdate(prev => ({
            ...prev,
            balance: prev.balance + prev.silverBalance,
            silverBalance: 0
        }));
    };
    
    const handleClaimEventReward = () => {
        if (canClaim) {
            onUserDataUpdate(prev => ({
                ...prev,
                balance: prev.balance + DAILY_REWARD_AMOUNT,
                lastClaimTimestamp: Date.now()
            }));
        }
    };
    
    const createRoomWrapper = async (roomData: Omit<RoomData, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'micSlots' | 'isRoomMuted' | 'attendees' >) => {
        try {
            await createRoom(roomData);
        } catch(e) {
            console.error("Failed to create room", e);
            toast({
                variant: "destructive",
                title: "Error creating room",
                description: "Please try again later.",
                duration: 2000,
            })
        }
    }

    const handlePurchaseVip = async (vipLevel: VipLevel) => {
        try {
            await userServices.purchaseVip(user.profile.userId, vipLevel.level, vipLevel.price);
            toast({ title: "🎉 تهانينا!", description: `لقد حصلت على ${vipLevel.name} بنجاح.`, duration: 2000 });
            setSelectedVipLevel(null);
        } catch(error) {
            console.error("Error purchasing VIP:", error);
            toast({ variant: "destructive", title: "فشل الشراء", description: (error as Error).message, duration: 2000 });
        }
    };

    const handleGiftVip = async (vipLevel: VipLevel, recipientId: string) => {
        try {
            await userServices.giftVip(user.profile.userId, recipientId, vipLevel.level, vipLevel.price);
            toast({ title: "تم الإهداء بنجاح!", description: `لقد أهديت ${vipLevel.name} إلى المستخدم ${recipientId}.`, duration: 2000 });
        } catch(error) {
            console.error("Error gifting VIP:", error);
            toast({ variant: "destructive", title: "فشل الإهداء", description: (error as Error).message, duration: 2000 });
        }
    };

    const handleNavigate = (targetView: 'coins' | 'silver' | 'level' | 'vipLevels' | 'leaderboard') => {
        if (targetView === 'leaderboard') {
            setView('leaderboard');
        } else {
            setProfileView(targetView);
        }
    };

    const renderContent = () => {
        if (isJoiningRoom) {
             return (
                <div className="flex items-center justify-center h-full bg-background text-foreground">
                    <p className="text-xl font-bold">...جاري تحميل الغرفة</p>
                </div>
            );
        }
        
        if (view === 'leaderboard') {
            return <TopSupportersScreen onBack={() => setView('roomsList')} />;
        }

        if (view === 'inRoom' && currentRoom) {
            return (
                <RoomScreen 
                    room={currentRoom}
                    user={user} 
                    onExit={handleExitRoom} 
                    onUserDataUpdate={onUserDataUpdate}
                    appStatus={appStatus}
                />
            );
        }
        if (view === 'events') {
            return <EventsScreen 
                        onClaimReward={handleClaimEventReward} 
                        canClaim={canClaim} 
                        timeUntilNextClaim={timeUntilNextClaim} 
                    />;
        }
        if (view === 'profile') {
            switch (profileView) {
                case 'coins':
                    return <CoinsScreen onBack={() => setProfileView('profile')} balance={user.balance} />;
                case 'silver':
                    return <SilverScreen onBack={() => setProfileView('profile')} silverBalance={user.silverBalance} onConvert={handleConvertSilver} />;
                case 'level':
                    return <LevelScreen onBack={() => setProfileView('profile')} user={user} />;
                case 'vipLevels':
                    return <VipScreen onBack={() => setProfileView('profile')} onSelectVipLevel={setSelectedVipLevel} />;
                default:
                    return (
                        <ProfileScreen 
                            user={user} 
                            onUserUpdate={handleUserUpdate}
                            onNavigate={handleNavigate}
                            onLogout={onLogout}
                            appStatus={appStatus}
                        />
                    );
            }
        }
        return <RoomsListScreen onEnterRoom={handleEnterRoom} onCreateRoom={createRoomWrapper} user={user.profile} onNavigate={handleNavigate} />;
    };


    return (
        <div className="h-screen flex flex-col">
            <VipDetailsSheet 
                isOpen={!!selectedVipLevel}
                onOpenChange={(open) => !open && setSelectedVipLevel(null)}
                vipLevel={selectedVipLevel}
                user={user}
                onPurchase={handlePurchaseVip}
                onGift={handleGiftVip}
            />
            <main className="flex-1 overflow-y-auto bg-background">
                {renderContent()}
            </main>
             {view !== 'inRoom' && view !== 'leaderboard' && (
                 <footer className="flex justify-around items-center p-2 border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
                     <button 
                        onClick={() => { setView('roomsList'); setProfileView('profile'); }}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                            view === 'roomsList' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}>
                        <MessageSquare className="w-6 h-6" />
                        <span className="text-xs font-medium">الغرف</span>
                    </button>
                    <button 
                        onClick={() => setView('events')}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                            view === 'events' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}>
                        <Gift className="w-6 h-6" />
                        <span className="text-xs font-medium">الأحداث</span>
                    </button>
                    <button 
                        onClick={() => setView('profile')}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                            view === 'profile' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}>
                        <User className="w-6 h-6" />
                        <span className="text-xs font-medium">أنا</span>
                    </button>
                </footer>
            )}
        </div>
    );
}

function MaintenanceScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4 text-center">
            <Wrench className="w-20 h-20 text-primary mb-6 animate-spin" style={{ animationDuration: '3s' }}/>
            <h1 className="text-3xl font-bold mb-4">التطبيق قيد الصيانة</h1>
            <p className="text-lg text-muted-foreground">
                نحن نعمل حاليًا على تحسين تجربتك. سنعود قريبًا!
            </p>
        </div>
    );
}


export default function HomePage() {
  const [nameInput, setNameInput] = useState("");
  const { toast } = useToast();
  const { appStatus, loading: appStatusLoading } = useAppStatus();
  
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUserData = localStorage.getItem("userData");
      if (savedUserData) {
        try {
          const userData = JSON.parse(savedUserData);
          return userData.profile.userId;
        } catch (error) {
          console.error("Failed to parse user data from localStorage", error);
        }
      }
    }
    return null;
  });

  const { userData, loading, error, setUserData } = useUser(userId);
  const [view, setView] = useState<'invitation' | 'profile' | 'app'>('app');
  const [invitationCode, setInvitationCode] = useState('');

  // Initialize data on first load
  useEffect(() => {
    giftServices.initializeGifts();
    gameMetaServices.initializeGames();
    invitationCodeServices.initializeCodes(INITIAL_INVITATION_CODES);
    appStatusServices.initializeAppStatus();

    // One-time reset for supporters
    const hasReset = localStorage.getItem('supporterReset_v1');
    if (!hasReset) {
      console.log("Performing one-time supporter data reset...");
      supporterServices.resetAllSupporters()
        .then(() => {
          console.log("Supporter data reset successfully.");
          localStorage.setItem('supporterReset_v1', 'true');
        })
        .catch(err => {
          console.error("Failed to reset supporter data:", err);
        });
    }

  }, []);

  useEffect(() => {
    if (!loading && !userData) {
      setView('invitation');
    } else {
      setView('app');
    }
  }, [loading, userData]);

  const handleCreateProfile = async (name: string, imageFile: File | null) => {
    if (!name.trim()) {
       toast({
          variant: "destructive",
          title: "بيانات غير مكتملة",
          description: "يرجى إدخال الاسم.",
          duration: 2000
      });
      return;
    }

    const newUserId = String(Math.floor(100000 + Math.random() * 900000));
    const isAdmin = ADMIN_USER_IDS.includes(newUserId);

    // Skip invitation code check for admins
    if (!isAdmin) {
        const isCodeValid = await invitationCodeServices.isInvitationCodeValid(invitationCode);
        if (!isCodeValid) {
            toast({
                variant: "destructive",
                title: "كود دعوة غير صالح",
                description: "يرجى إدخال كود صحيح للمتابعة.",
                duration: 2000
            });
            return;
        }
    }

    let imageUrl = `https://placehold.co/128x128.png`;
    if (imageFile) {
        try {
            imageUrl = await uploadImageAndGetUrl(imageFile, `profile_images/${newUserId}`);
        } catch (uploadError) {
            console.error("Error uploading profile image during creation:", uploadError);
            toast({ variant: "destructive", title: "فشل رفع الصورة", duration: 2000 });
        }
    }

    const newUserProfile: UserProfile = { 
      name: name.trim(), 
      image: imageUrl,
      userId: newUserId,
      displayId: newUserId,
    };
    
    const initialBalance = isAdmin ? 1000000000 : 0;

    const newUserRecord: UserData = {
        profile: newUserProfile,
        balance: initialBalance,
        silverBalance: 50000,
        lastClaimTimestamp: null,
        level: 0,
        totalSupportGiven: 0,
        vipLevel: 0,
        isBanned: false,
        isOfficial: false,
    };

    try {
      await userServices.saveUser(newUserRecord);
      if (!isAdmin) {
        await invitationCodeServices.markInvitationCodeAsUsed(invitationCode, newUserId);
      }
      setUserId(newUserId);
      setUserData(newUserRecord);

      toast({
          title: "تم حفظ الملف الشخصي",
          description: "مرحبًا بك في التطبيق!",
          duration: 2000
      });
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
          variant: "destructive",
          title: "خطأ في إنشاء الملف الشخصي",
          description: "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
          duration: 2000
      });
    }
  };
  
  const handleLogout = () => {
    try {
      localStorage.removeItem('userData');
      setUserId(null); 
      setUserData(null);
      setNameInput("");
      toast({ title: "تم تسجيل الخروج", duration: 2000 });
    } catch (error) {
      console.error('Error during logout:', error);
      setUserId(null);
      setUserData(null);
      setNameInput("");
      toast({ title: "تم تسجيل الخروج", duration: 2000 });
    }
  }

  const handleSetUserData = (updater: (data: UserData) => UserData) => {
    if (userData) {
      const updatedData = updater(userData);
      setUserData(updatedData);
    }
  };

  const handleProceedToProfileCreation = async () => {
    const isValid = await invitationCodeServices.isInvitationCodeValid(invitationCode);
    if (isValid) {
        setView('profile');
    } else {
        toast({
            variant: "destructive",
            title: "كود دعوة غير صالح",
            description: "الكود الذي أدخلته غير صحيح أو مستخدم بالفعل.",
            duration: 2000
        });
    }
  };

  if (loading || appStatusLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4">
            <h1 className="text-2xl font-bold">...جاري التحميل</h1>
            {error && (
                <p className="text-red-400 mt-2">تحذير: {error}</p>
            )}
            <p className="text-gray-400 mt-4 text-sm">إذا استمر التحميل، جرب تحديث الصفحة</p>
        </div>
    );
  }

  const isAdminUser = userData && ADMIN_USER_IDS.includes(userData.profile.userId);
  if (appStatus?.isMaintenanceMode && !isAdminUser) {
    return <MaintenanceScreen />;
  }

  if (userData?.isBanned) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
            <Ban className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-4">تم حظر حسابك</h1>
            <p className="text-gray-300 mb-8">تم حظر هذا الحساب من استخدام التطبيق.</p>
            <Button onClick={handleLogout} variant="destructive">تسجيل الخروج</Button>
        </div>
    );
  }

  if (!userData) {
    if (view === 'invitation') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4">
                <div className="w-full max-w-sm text-center">
                    <KeyRound className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h1 className="text-2xl font-bold mb-2">كود الدعوة مطلوب</h1>
                    <p className="text-gray-300 mb-8">يرجى إدخال كود دعوة صالح للمتابعة.</p>
                    
                    <div className="space-y-4 text-right">
                         <Input 
                            placeholder="أدخل كود الدعوة..."
                            value={invitationCode}
                            onChange={(e) => setInvitationCode(e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 text-center"
                            onKeyPress={(e) => e.key === 'Enter' && handleProceedToProfileCreation()}
                        />
                    </div>
                    <Button 
                        onClick={handleProceedToProfileCreation} 
                        size="lg" 
                        className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={!invitationCode.trim()}
                    >
                        متابعة
                    </Button>
                </div>
            </div>
        );
    }

    if (view === 'profile') {
        const CreateProfileScreen = () => {
            const [nameInput, setNameInput] = useState("");
            const [imagePreview, setImagePreview] = useState<string | null>("https://placehold.co/128x128.png");
            const [imageFile, setImageFile] = useState<File | null>(null);
            const fileInputRef = useRef<HTMLInputElement>(null);
    
            const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (file) {
                    setImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                }
            };
    
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4">
                    <div className="w-full max-w-sm text-center">
                        <h1 className="text-2xl font-bold mb-4">إنشاء ملف شخصي</h1>
                        <p className="text-gray-300 mb-8">أكمل ملفك الشخصي للمتابعة</p>
                        
                        <button className="relative group mx-auto mb-4" onClick={() => fileInputRef.current?.click()}>
                            <Avatar className="w-24 h-24 border-4 border-primary">
                                <AvatarImage src={imagePreview ?? undefined} />
                                <AvatarFallback><Camera/></AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
    
                        <div className="space-y-4 text-right">
                             <Input 
                                placeholder="أدخل اسمك..."
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 text-center"
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateProfile(nameInput, imageFile)}
                            />
                        </div>
    
                        <Button 
                            onClick={() => handleCreateProfile(nameInput, imageFile)} 
                            size="lg" 
                            className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                            disabled={!nameInput.trim()}
                        >
                            حفظ ومتابعة
                        </Button>
                        
                        {error && (
                            <p className="text-red-400 mt-4 text-sm">تحذير: لا يمكن الاتصال بـ Firebase. سيتم حفظ البيانات محلياً.</p>
                        )}
                        
                        <p className="text-gray-400 mt-4 text-xs">
                            اضغط Enter أو انقر على الزر لحفظ الملف الشخصي
                        </p>
                    </div>
                     <div className="text-center text-xs text-gray-300 pt-8">
                        <p>من خلال الاستمرار، فإنك توافق على</p>
                        <p>
                            <Link href="#" className="underline">شروط الخدمة</Link> و <Link href="#" className="underline">سياسة الخصوصية</Link>
                        </p>
                    </div>
                </div>
            );
        }
        return <CreateProfileScreen />;
    }

    return null; // Should not be reached if logic is correct
  }

  return <MainApp 
            user={userData}
            onUserDataUpdate={handleSetUserData}
            onLogout={handleLogout}
            appStatus={appStatus}
        />;
}
