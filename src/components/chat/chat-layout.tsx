'use client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { LogOut, Search, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';
import ChatView from './chat-view';
import { Icons } from '../icons';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ContactsList from './contacts-list';
import ExplorePage from './explore-page';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const aiAssistant: User = {
  uid: 'ai-assistant',
  displayName: 'King AJ',
  email: 'ai@voxalo.com',
  photoURL: '', // Will be replaced by bot icon
};

interface ChatLayoutProps {
  currentUser: FirebaseUser;
}

export default function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => doc.data() as User);
      setUsers([aiAssistant, ...usersData]);
    });
    return () => unsubscribe();
  }, [currentUser]);

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.photoURL!} alt={currentUser.displayName!} />
                  <AvatarFallback>{currentUser.displayName?.[0]}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => auth.signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="contacts" className="flex flex-col flex-1">
          <TabsList className="m-4">
            <TabsTrigger value="contacts" className="w-full">
              Contacts
            </TabsTrigger>
            <TabsTrigger value="explore" className="w-full">
              Explore
            </TabsTrigger>
          </TabsList>
          <div className="p-4 pt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <TabsContent value="contacts" className="flex-1 overflow-y-auto mt-0">
            <ContactsList
              users={filteredUsers}
              selectedUser={selectedUser}
              onSelectUser={handleSelectUser}
            />
          </TabsContent>
          <TabsContent value="explore" className="flex-1 overflow-y-auto mt-0">
            <ExplorePage search={search} />
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden flex-1 md:flex">
        <ChatView currentUser={currentUser} selectedUser={selectedUser} />
      </div>
    </div>
  );
}
