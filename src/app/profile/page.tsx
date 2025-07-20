"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState('https://placehold.co/100x100.png');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!name || !age || !country || !gender) {
      toast({
        variant: "destructive",
        title: "Incomplete Profile",
        description: "Please fill out all fields to continue.",
      });
      return;
    }

    const userProfile = { name, age, country, gender, avatar, coins: 10000000 };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    toast({
      title: "Profile Created!",
      description: "Welcome! You're now being redirected to the chat room.",
    });
    router.push('/room');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900/50" style={{
      backgroundImage: 'url(https://placehold.co/1920x1080/0a0a0a/444444?text=.)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }} data-ai-hint="space stars">
      <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm animate-slide-in">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Create Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatar} alt="User Avatar" />
              <AvatarFallback>{name.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Input id="picture" type="file" className="text-xs" onChange={handleAvatarChange} accept="image/*" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="Your age" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={setGender} value={gender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" placeholder="Enter your country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit}>Save & Enter Room</Button>
        </CardContent>
      </Card>
    </main>
  );
}
