
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare, Copy, ChevronLeft, Search, PlusCircle, Mic, Send, MicOff, Trophy, Users, Share2, Power, Volume2, Gift, Smile, XCircle, Trash2, Lock, Unlock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";


// --- Types ---
interface UserProfile {
    name: string;
    image: string;
    userId: string;
}

interface Room {
    id: string;
    name: string;
    image: string;
    ownerId: string;
}

interface ChatMessage {
    id: string;
    user: UserProfile;
    text: string;
}

interface MicSlot {
    user: UserProfile | null;
    isMuted: boolean;
    isLocked: boolean;
}


// --- TopBar Component ---
function TopBar({ name, image, userId, onBack }: { name: string | null, image: string | null, userId: string | null, onBack: () => void }) {
    const { toast } = useToast();

    const handleCopyId = () => {
        if (userId) {
            navigator.clipboard.writeText(userId);
            toast({
                title: "تم نسخ الـ ID",
                description: "تم نسخ هوية المستخدم إلى الحافظة.",
            });
        }
    };

    return (
        <header className="flex items-center justify-between p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
             <Button variant="ghost" size="icon" onClick={onBack}>
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
                 <div className="text-right">
                    <p className="font-bold text-lg">{name}</p>
                    {userId && (
                        <div className="flex items-center justify-end gap-1.5">
                             <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground">
                                <Copy className="h-3 w-3" />
                            </button>
                            <span className="text-sm text-muted-foreground">{userId}</span>
                        </div>
                    )}
                </div>
                <Avatar className="w-12 h-12">
                    <AvatarImage src={image || ''} alt={name || ''} />
                    <AvatarFallback>{name ? name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

// --- ProfileScreen Component ---
function ProfileScreen({ onReset }: { onReset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
             <p className="text-muted-foreground mb-6">
               مرحبًا بك! يمكنك إدارة حسابك من هنا.
            </p>
        </div>
    );
}


// --- Rooms Feature Components ---

function CreateRoomDialog({ user, onRoomCreated }: { user: UserProfile, onRoomCreated: (room: Room) => void }) {
    const [roomName, setRoomName] = useState("");
    const [roomImage, setRoomImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setRoomImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCreateRoom = () => {
        if (!roomName || !roomImage) {
            toast({ variant: "destructive", title: "بيانات غير مكتملة", description: "يرجى إدخال اسم للغرفة واختيار صورة." });
            return;
        }

        const newRoom: Room = {
            id: Math.floor(100000 + Math.random() * 900000).toString(),
            name: roomName,
            image: roomImage,
            ownerId: user.userId,
        };

        const existingRooms: Room[] = JSON.parse(localStorage.getItem('userRooms') || '[]');
        localStorage.setItem('userRooms', JSON.stringify([...existingRooms, newRoom]));
        
        toast({ title: "تم إنشاء الغرفة بنجاح!" });
        onRoomCreated(newRoom);
        setIsOpen(false);
        setRoomName("");
        setRoomImage(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="sm">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إنشاء غرفة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">إنشاء غرفة جديدة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <AvatarImage src={roomImage || ''} />
                            <AvatarFallback><Camera className="w-8 h-8" /></AvatarFallback>
                        </Avatar>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    </div>
                     <Input
                        id="name"
                        placeholder="أدخل اسم الغرفة..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="text-right"
                    />
                </div>
                 <Button onClick={handleCreateRoom} type="submit">إنشاء</Button>
            </DialogContent>
        </Dialog>
    );
}

function RoomsListScreen({ user, onEnterRoom, onRoomUpdated }: { user: UserProfile, onEnterRoom: (room: Room) => void, onRoomUpdated: (updatedRoom: Room) => void }) {
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    
    useEffect(() => {
        const rooms = JSON.parse(localStorage.getItem('userRooms') || '[]') as Room[];
        setMyRooms(rooms);
    }, []);


    const handleRoomCreated = (newRoom: Room) => {
        setMyRooms(prev => [...prev, newRoom]);
        onEnterRoom(newRoom);
    }
    
    const handleDeleteRoom = (roomIdToDelete: string) => {
        const updatedRooms = myRooms.filter(room => room.id !== roomIdToDelete);
        setMyRooms(updatedRooms);
        localStorage.setItem('userRooms', JSON.stringify(updatedRooms));
    };


    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-2 border-b">
                <CreateRoomDialog user={user} onRoomCreated={handleRoomCreated} />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">الغرف المتاحة</Button>
                    <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                </div>
            </header>
            <div className="flex-1 p-4 text-right">
                <h2 className="text-xl font-bold mb-4">غرفي</h2>
                {myRooms.length === 0 ? (
                    <p className="text-muted-foreground">لم تقم بإنشاء أي غرف بعد.</p>
                ) : (
                    <div className="grid gap-3">
                        {myRooms.map(room => (
                            <div key={room.id} className="relative group">
                                <button onClick={() => onEnterRoom(room)} className="w-full text-right p-0.5 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-2xl shadow-lg">
                                    <div className="bg-gradient-to-b from-yellow-50 via-amber-50 to-yellow-100 rounded-[14px] p-3 flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800">{room.name}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">مرحبا بكم في غرفة {room.name}</p>
                                                </div>
                                                <div className="bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                    <span>{Math.floor(Math.random() * 500) + 10}</span>
                                                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0H9.33333V10H11V0Z" fill="white"/><path d="M7.33333 3.33333H5.66667V10H7.33333V3.33333Z" fill="white"/><path d="M3.66667 6.66667H2V10H3.66667V6.66667Z" fill="white"/></svg>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className="bg-purple-800 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">ID</div>
                                                <span className="text-gray-600 font-semibold">{room.id}</span>
                                            </div>
                                        </div>
                                        <div className="w-20 h-20 rounded-lg p-0.5 bg-gradient-to-b from-yellow-400 to-yellow-600">
                                            <Avatar className="w-full h-full rounded-md">
                                                <AvatarImage src={room.image} alt={room.name} />
                                                <AvatarFallback>{room.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                </button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="absolute top-2 left-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                سيتم حذف هذه الغرفة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteRoom(room.id)}>حذف</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EditRoomDialog({ room, onRoomUpdated, children }: { room: Room, onRoomUpdated: (updatedRoom: Room) => void, children: React.ReactNode }) {
    const [roomName, setRoomName] = useState(room.name);
    const [roomImage, setRoomImage] = useState<string>(room.image);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setRoomImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        const updatedRoom = { ...room, name: roomName, image: roomImage };
        
        // Update localStorage
        const existingRooms: Room[] = JSON.parse(localStorage.getItem('userRooms') || '[]');
        const roomIndex = existingRooms.findIndex(r => r.id === updatedRoom.id);
        if (roomIndex !== -1) {
            existingRooms[roomIndex] = updatedRoom;
            localStorage.setItem('userRooms', JSON.stringify(existingRooms));
        }
        
        onRoomUpdated(updatedRoom);
        toast({ title: "تم تحديث الغرفة!" });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">تعديل الغرفة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <div className="flex flex-col items-center gap-4">
                         <Avatar className="w-24 h-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <AvatarImage src={roomImage} />
                            <AvatarFallback><Camera className="w-8 h-8" /></AvatarFallback>
                        </Avatar>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    </div>
                     <Input
                        id="name"
                        placeholder="أدخل اسم الغرفة..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="text-right"
                    />
                </div>
                <DialogClose asChild>
                    <Button onClick={handleSaveChanges}>حفظ التغييرات</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}


function RoomScreen({ room, user, onExit, onRoomUpdated }: { room: Room, user: UserProfile, onExit: () => void, onRoomUpdated: (updatedRoom: Room) => void }) {
     const { toast } = useToast();
     const [micSlots, setMicSlots] = useState<MicSlot[]>(Array(10).fill({ user: null, isMuted: false, isLocked: false }));
     const [isSpeaking, setIsSpeaking] = useState(false);
     
     const myMicIndex = micSlots.findIndex(slot => slot.user?.userId === user.userId);
     const isOwner = user.userId === room.ownerId;
     
     useEffect(() => {
        // This effect simulates speaking. In a real app, this would be driven
        // by a voice activity detection system.
        if (myMicIndex !== -1 && !micSlots[myMicIndex].isMuted) {
            const interval = setInterval(() => {
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), 1500); // Speak for 1.5s
            }, 4000); // "Speak" every 4 seconds
            return () => {
                clearInterval(interval);
                setIsSpeaking(false);
            };
        } else {
            // If I'm not on a mic or I'm muted, I'm not speaking.
            setIsSpeaking(false);
        }
     }, [myMicIndex, micSlots]);


     const handleCopyId = () => {
        navigator.clipboard.writeText(room.id);
        toast({ title: "تم نسخ ID الغرفة" });
    };

    const handleAscend = (index: number) => {
        if (myMicIndex !== -1) {
            toast({ variant: "destructive", description: "أنت بالفعل على مايك آخر."});
            return;
        }
        if (micSlots[index].user) {
            toast({ variant: "destructive", description: "هذا المايك مشغول."});
            return;
        }
        if (micSlots[index].isLocked) {
            toast({ variant: "destructive", description: "هذا المايك مقفل."});
            return;
        }
        setMicSlots(prev => {
            const newSlots = [...prev];
            newSlots[index] = { ...newSlots[index], user: user, isMuted: false };
            return newSlots;
        });
    }

    const handleDescend = (indexToDescend: number) => {
         setMicSlots(prev => {
            const newSlots = [...prev];
            // Only allow descending if the user exists on that slot
            if (newSlots[indexToDescend].user) {
                newSlots[indexToDescend] = { user: null, isMuted: false, isLocked: newSlots[indexToDescend].isLocked };
            }
            return newSlots;
        });
    }
    
    const handleToggleMute = () => {
         if (myMicIndex !== -1) {
            setMicSlots(prevSlots => {
                const newSlots = [...prevSlots];
                const currentSlot = newSlots[myMicIndex];
                if (currentSlot) {
                    newSlots[myMicIndex] = { ...currentSlot, isMuted: !currentSlot.isMuted };
                }
                return newSlots;
            });
        }
    }

    const handleToggleLock = (index: number) => {
        if (isOwner) {
            setMicSlots(prev => {
                const newSlots = [...prev];
                newSlots[index] = { ...newSlots[index], isLocked: !newSlots[index].isLocked };
                return newSlots;
            });
        }
    }
    
    const RoomMic = ({slot, index}: {slot: MicSlot, index: number}) => {
        const isCurrentUser = slot.user?.userId === user.userId;
        const isCurrentUserOwner = isCurrentUser && isOwner;
        const showSpeakingAnimation = isCurrentUser && isSpeaking && !slot.isMuted;

        return (
             <Popover>
                <PopoverTrigger asChild>
                    <div className="flex flex-col items-center gap-1 cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center relative">
                             {slot.user ? (
                                <>
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
                                    {isCurrentUser && slot.isMuted && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                            <XCircle className="w-8 h-8 text-red-500"/>
                                        </div>
                                    )}
                                     {isCurrentUserOwner && (
                                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-background">
                                            OWNER
                                        </div>
                                    )}
                                </>
                            ) : slot.isLocked ? (
                                <Lock className="w-8 h-8 text-primary/50" />
                            ) : (
                                <Mic className="w-8 h-8 text-primary" />
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
                    <div className="flex flex-col gap-2 p-2">
                        {isCurrentUser ? (
                            <>
                                <Button variant="outline" onClick={handleToggleMute}>
                                    {slot.isMuted ? "إلغاء الكتم" : "كتم المايك"}
                                </Button>
                                <Button variant="destructive" onClick={() => handleDescend(index)}>النزول من المايك</Button>
                            </>
                        ) : !slot.user ? ( // Mic is empty
                            isOwner ? ( // Owner sees lock/unlock and ascend
                                slot.isLocked ? (
                                    <Button onClick={() => handleToggleLock(index)}>فتح المايك <Unlock className="mr-2"/></Button>
                                ) : (
                                    <>
                                        <Button onClick={() => handleAscend(index)}>الصعود على المايك</Button>
                                        <Button variant="secondary" onClick={() => handleToggleLock(index)}>قفل المايك <Lock className="mr-2"/></Button>
                                    </>
                                )
                            ) : ( // Non-owner sees ascend only
                                 <Button onClick={() => handleAscend(index)} disabled={slot.isLocked}>الصعود على المايك</Button>
                            )
                        ) : isOwner ? ( // Mic is occupied, and current user is owner
                            <Button variant="destructive" onClick={() => handleDescend(index)}>طرد من المايك</Button>
                        ): (
                            <p className="p-2 text-center text-sm">هذا المايك مشغول</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    const RoomHeader = () => {
         const roomInfoContent = (
             <div className="flex items-center gap-2 p-1.5 rounded-full bg-black/20 cursor-pointer">
                <div className="text-right">
                    <p className="font-bold text-sm">{room.name}</p>
                    <div className="flex items-center justify-end gap-1.5">
                        <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                        </button>
                        <span className="text-xs text-muted-foreground">{room.id}</span>
                    </div>
                </div>
                <Avatar className="w-10 h-10">
                    <AvatarImage src={room.image} alt={room.name} />
                    <AvatarFallback>{room.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>
        );

        return (
             <header className="flex items-start justify-between p-3 z-10">
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="bg-black/20 rounded-full">
                                <Power className="w-5 h-5 text-primary" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                           <Button variant="destructive" onClick={onExit}>الخروج من الغرفة</Button>
                        </PopoverContent>
                    </Popover>
                </div>
                {isOwner ? (
                    <EditRoomDialog room={room} onRoomUpdated={onRoomUpdated}>
                        {roomInfoContent}
                    </EditRoomDialog>
                ) : (
                    roomInfoContent
                )}
            </header>
        )
    }

    return (
         <div className="flex flex-col h-screen bg-background text-foreground">
            <RoomHeader />

            {/* Sub-header */}
            <div className="flex items-center justify-between px-4 mt-2 z-10">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary text-sm font-bold">1</div>
                   <div className="flex -space-x-4 rtl:space-x-reverse">
                       <Avatar className="w-8 h-8 border-2 border-background">
                           <AvatarImage src="https://placehold.co/100x100.png" />
                           <AvatarFallback>A</AvatarFallback>
                       </Avatar>
                   </div>
                </div>
                <div className="flex items-center gap-2 p-1 px-3 rounded-full bg-red-800/50 border border-red-500">
                    <span className="font-bold text-sm">0</span>
                    <Trophy className="w-5 h-5 text-yellow-400"/>
                </div>
            </div>
            
            {/* Mic Grid */}
            <div className="grid grid-cols-5 gap-y-4 gap-x-4 p-4 z-10">
                {micSlots.slice(0, 5).map((slot, index) => <RoomMic key={index} slot={slot} index={index} />)}
                {micSlots.slice(5, 10).map((slot, index) => <RoomMic key={index+5} slot={slot} index={index+5} />)}
            </div>

            {/* Floating Game Button */}
            <Link href="/project-885" passHref>
                <Button variant="ghost" size="icon" className="absolute bottom-24 left-4 w-14 h-14 bg-black/40 rounded-full border-2 border-primary z-20">
                     <Gamepad2 className="w-8 h-8 text-primary" />
                </Button>
            </Link>

        </div>
    );
}


// --- Main App Shell ---
function MainApp({ user, onReset }: { user: UserProfile, onReset: () => void }) {
    const [activeTab, setActiveTab] = useState('rooms');
    const [roomView, setRoomView] = useState<'list' | 'in_room'>('list');
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

    const handleEnterRoom = (room: Room) => {
        setCurrentRoom(room);
        setRoomView('in_room');
    };

    const handleExitRoom = () => {
        setCurrentRoom(null);
        setRoomView('list');
    };
    
    const handleProfileClick = () => {
        if (activeTab === 'profile') {
           setActiveTab('rooms');
        } else {
           setActiveTab('profile');
        }
    }

    const handleRoomUpdated = (updatedRoom: Room) => {
        // Update the room in the main state
        setCurrentRoom(updatedRoom);

        // Update the room in localStorage is handled in EditRoomDialog to persist changes
    };

    if (roomView === 'in_room' && currentRoom) {
        return <RoomScreen room={currentRoom} user={user} onExit={handleExitRoom} onRoomUpdated={handleRoomUpdated} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileScreen onReset={onReset} />;
            case 'rooms':
                return <RoomsListScreen user={user} onEnterRoom={handleEnterRoom} onRoomUpdated={handleRoomUpdated}/>;
            default:
                return <RoomsListScreen user={user} onEnterRoom={handleEnterRoom} onRoomUpdated={handleRoomUpdated}/>;
        }
    }

    return (
        <div className="flex flex-col h-screen">
            {activeTab === 'profile' ? (
                <TopBar name={user.name} image={user.image} userId={user.userId} onBack={handleReset} />
            ) : null }
            <main className="flex-1 overflow-y-auto bg-background">
                {renderContent()}
            </main>
            <footer className="flex justify-around items-center p-2 border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
                 <button 
                    onClick={() => setActiveTab('rooms')} 
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        activeTab === 'rooms' ? "text-primary" : "hover:text-foreground"
                    )}>
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-xs font-medium">الغرف</span>
                </button>
                 <Link href="/project-885" passHref>
                    <div className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        "hover:text-foreground"
                    )}>
                        <Gamepad2 className="w-6 h-6" />
                        <span className="text-xs font-medium">اللعبة</span>
                    </div>
                </Link>
                <button 
                    onClick={handleProfileClick}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        activeTab === 'profile' ? "text-primary" : "hover:text-foreground"
                    )}>
                    <User className="w-6 h-6" />
                </button>
            </footer>
        </div>
    );
}


// --- Root Component & Profile Gate ---
export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const savedImage = localStorage.getItem("userImage");
    const savedUserId = localStorage.getItem("userId");
    if (savedName && savedImage && savedUserId) {
      setUser({ name: savedName, image: savedImage, userId: savedUserId });
    }
    setIsLoading(false);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (name && image) {
      let currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
          currentUserId = Math.floor(100000 + Math.random() * 900000).toString();
          localStorage.setItem("userId", currentUserId);
      }
      localStorage.setItem("userName", name);
      localStorage.setItem("userImage", image);
      
      setUser({ name, image, userId: currentUserId });

      toast({
          title: "تم حفظ الملف الشخصي",
          description: "مرحبًا بك في التطبيق!",
      });
    } else {
       toast({
          variant: "destructive",
          title: "بيانات غير مكتملة",
          description: "يرجى إدخال الاسم واختيار صورة.",
      });
    }
  };
  
  const handleReset = () => {
    setUser(null); 
    const savedName = localStorage.getItem("userName");
    const savedImage = localStorage.getItem("userImage");
    setName(savedName);
    setImage(savedImage);
  }
  
  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          </div>
      )
  }

  if (user) {
    return <MainApp user={user} onReset={handleReset} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">إنشاء ملفك الشخصي</CardTitle>
          <CardDescription className="text-center">
            أدخل اسمك واختر صورة للبدء
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative">
            <Avatar className="w-32 h-32 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={image || ''} />
              <AvatarFallback className="text-4xl">
                <Camera className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          
          <Input
            type="text"
            placeholder="أدخل اسمك..."
            value={name || ''}
            onChange={(e) => setName(e.target.value)}
            className="text-center text-lg"
          />

          <Button onClick={handleSave} className="w-full" size="lg">
            حفظ ومتابعة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
