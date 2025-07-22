"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

export default function HomePage() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isProfileSet, setIsProfileSet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from localStorage on initial mount
  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const savedImage = localStorage.getItem("userImage");
    if (savedName && savedImage) {
      setName(savedName);
      setImage(savedImage);
      setIsProfileSet(true);
    }
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
      localStorage.setItem("userName", name);
      localStorage.setItem("userImage", image);
      setIsProfileSet(true);
    } else {
      alert("يرجى إدخال الاسم واختيار صورة.");
    }
  };
  
  const handleReset = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userImage");
    setName("");
    setImage(null);
    setIsProfileSet(false);
  }

  if (isProfileSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4" dir="rtl">
        <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={image || ''} alt={name} />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
                <CardTitle className="text-2xl">مرحباً بك يا {name}!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">
                    أنت الآن جاهز للانطلاق في مشاريعك.
                </p>
                <Button onClick={handleReset} variant="link">إعادة تعيين الملف الشخصي</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">إنشاء ملفك الشخصي</CardTitle>
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
            value={name}
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