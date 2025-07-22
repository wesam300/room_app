
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare, Copy, ChevronLeft, Search, PlusCircle, Mic, Send, MicOff, Trophy, Users, Share2, Power, Volume2, Gift, Smile, XCircle } from "lucide-react";
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
            id: `room_${Math.random().toString(36).substr(2, 9)}`,
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

function RoomsListScreen({ user, onEnterRoom }: { user: UserProfile, onEnterRoom: (room: Room) => void }) {
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    
    useEffect(() => {
        const rooms = JSON.parse(localStorage.getItem('userRooms') || '[]') as Room[];
        setMyRooms(rooms);
    }, []);


    const handleRoomCreated = (newRoom: Room) => {
        setMyRooms(prev => [...prev, newRoom]);
        onEnterRoom(newRoom);
    }

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
                    <div className="grid gap-4">
                        {myRooms.map(room => (
                             <button key={room.id} onClick={() => onEnterRoom(room)} className="w-full text-right p-3 bg-muted rounded-lg flex items-center gap-3">
                                 <Avatar>
                                     <AvatarImage src={room.image} alt={room.name} />
                                     <AvatarFallback>{room.name.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <span>{room.name}</span>
                             </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RoomScreen({ room, user, onExit }: { room: Room, user: UserProfile, onExit: () => void }) {
     const { toast } = useToast();
     const [micSlots, setMicSlots] = useState<MicSlot[]>(Array(10).fill({ user: null, isMuted: false }));
     const myMicIndex = micSlots.findIndex(slot => slot.user?.userId === user.userId);
     const [isSpeaking, setIsSpeaking] = useState(false); 
     
     useEffect(() => {
        if (myMicIndex !== -1 && !micSlots[myMicIndex].isMuted) {
            // In a real app, this would be controlled by a voice activity detection library.
            // For now, we simulate speaking for demonstration.
            const interval = setInterval(() => {
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), 1500); 
            }, 4000);
            return () => {
                clearInterval(interval)
                setIsSpeaking(false);
            };
        } else {
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
        setMicSlots(prev => {
            const newSlots = [...prev];
            newSlots[index] = { user: user, isMuted: false };
            return newSlots;
        });
    }

    const handleDescend = () => {
        if (myMicIndex !== -1) {
             setMicSlots(prev => {
                const newSlots = [...prev];
                newSlots[myMicIndex] = { user: null, isMuted: false };
                return newSlots;
            });
        }
    }
    
    const handleToggleMute = () => {
         if (myMicIndex !== -1) {
             setMicSlots(prev => {
                const newSlots = [...prev];
                newSlots[myMicIndex].isMuted = !newSlots[myMicIndex].isMuted;
                return newSlots;
            });
        }
    }
    
    const RoomMic = ({slot, index}: {slot: MicSlot, index: number}) => {
        const isCurrentUser = slot.user?.userId === user.userId;
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
                                </>
                            ) : (
                                <Mic className="w-8 h-8 text-primary" />
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">no.{index + 1}</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <div className="flex flex-col gap-2 p-2">
                        {isCurrentUser ? (
                            <>
                                <Button variant="outline" onClick={handleToggleMute}>
                                    {slot.isMuted ? "إلغاء الكتم" : "كتم المايك"}
                                </Button>
                                <Button variant="destructive" onClick={handleDescend}>النزول من المايك</Button>
                            </>
                        ) : !slot.user ? (
                            <Button onClick={() => handleAscend(index)}>الصعود على المايك</Button>
                        ) : (
                            <p className="p-2 text-center text-sm">هذا المايك مشغول</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    return (
         <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className="flex items-start justify-between p-3 z-10">
                {/* Left controls */}
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
                {/* Right Info */}
                <div className="flex items-center gap-2 p-1.5 rounded-full bg-black/20">
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
            </header>

            {/* Sub-header */}
            <div className="flex items-center justify-between px-4 mt-2 z-10">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary text-sm font-bold">1</div>
                   <div className="flex -space-x-4 rtl:space-x-reverse">
                       {/* Placeholder for connected users */}
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
    
    if (roomView === 'in_room' && currentRoom) {
        return <RoomScreen room={currentRoom} user={user} onExit={handleExitRoom} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileScreen onReset={onReset} />;
            case 'rooms':
                return <RoomsListScreen user={user} onEnterRoom={handleEnterRoom} />;
            default:
                return <RoomsListScreen user={user} onEnterRoom={handleEnterRoom} />;
        }
    }

    return (
        <div className="flex flex-col h-screen">
            {activeTab === 'profile' && (
                <TopBar name={user.name} image={user.image} userId={user.userId} onBack={onReset} />
            )}
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
                    onClick={() => setActiveTab('profile')} 
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

    