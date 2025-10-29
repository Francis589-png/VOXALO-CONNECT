'use client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { LogOut, Search } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';
import ChatView from './chat-view';
import { Icons } from '../icons';

export default function ChatLayout() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => doc.data() as User);
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const filteredUsers = users.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full">
      <div className="flex h-full max-h-screen w-full flex-col md:w-80 md:border-r">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Icons.logo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">VoxaLo</h1>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => auth.signOut()}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sign Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {filteredUsers.map((contact) => (
              <button
                key={contact.uid}
                onClick={() => handleSelectUser(contact)}
                className={`flex items-center gap-3 p-4 text-left hover:bg-muted/50 ${
                  selectedUser?.uid === contact.uid ? 'bg-muted' : ''
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.photoURL!} alt={contact.displayName!} />
                  <AvatarFallback>{contact.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{contact.displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden flex-1 md:flex">
        <ChatView currentUser={user!} selectedUser={selectedUser} />
      </div>
    </div>
  );
}
