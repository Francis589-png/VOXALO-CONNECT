'use client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { LogOut, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
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
        <ChatView currentUser={user!} selectedUser={selectedUser} />
      </div>
    </div>
  );
}
