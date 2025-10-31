
'use client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { LogOut, Search as SearchIcon, User as UserIcon, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import type { Chat, User } from '@/types';
import ChatView from './chat-view';
import { Icons } from '../icons';
import { Button } from '../ui/button';
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
import CreateGroupDialog from './create-group-dialog';
import { requestNotificationPermission } from '@/lib/firebase-messaging';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


interface ChatLayoutProps {
  currentUser: FirebaseUser;
}

export default function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [search, setSearch] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default' && currentUser.uid) {
      requestNotificationPermission(currentUser.uid);
    }
  }, [currentUser.uid]);

  useEffect(() => {
    if (!currentUser) return;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => doc.data() as User);
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setIsCreatingGroup(false);
  };
  
  const handleBack = () => {
    setSelectedChat(null);
  };

  const filteredUsers = users.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full">
      <div className={cn(
          "flex h-full max-h-screen w-full flex-col md:w-80 md:border-r md:bg-background/80 md:backdrop-blur-xl",
          isMobile && selectedChat && "hidden"
      )}>
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2 group">
            <Icons.logo className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
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
          <div className='p-4'>
            <TabsList className="w-full">
              <TabsTrigger value="contacts" className="w-full">
                Contacts
              </TabsTrigger>
              <TabsTrigger value="explore" className="w-full">
                Explore
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-4 pt-0">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <TabsContent value="contacts" className="flex-1 overflow-y-auto mt-0">
            <CreateGroupDialog currentUser={currentUser} onGroupCreated={handleSelectChat}>
                <Button variant="ghost" className="w-full justify-start gap-3 p-4 text-left h-auto rounded-none">
                    <div className='p-2 bg-muted rounded-full'>
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-semibold">New Group</p>
                    </div>
                </Button>
            </CreateGroupDialog>
            <ContactsList
              users={filteredUsers}
              selectedChat={selectedChat}
              onSelectChat={handleSelectChat}
              search={search}
            />
          </TabsContent>
          <TabsContent value="explore" className="flex-1 overflow-y-auto mt-0">
            <ExplorePage search={search} />
          </TabsContent>
        </Tabs>
      </div>
      <div className={cn("flex-1", (!isMobile || selectedChat) ? "flex" : "hidden")}>
        <ChatView 
            currentUser={currentUser} 
            selectedChat={selectedChat}
            onBack={isMobile ? handleBack : undefined}
            onChatDeleted={() => setSelectedChat(null)}
        />
      </div>
    </div>
  );
}
