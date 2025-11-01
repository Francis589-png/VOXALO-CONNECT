

'use client';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { LogOut, Search as SearchIcon, User as UserIcon, Users, Swords, Clapperboard, Sparkles, Newspaper, MessageSquareQuote } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
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
import GamesBrowserPage from './games-browser-page';
import VideoBrowserPage from './video-browser-page';
import { useTotalUnreadCount } from '@/hooks/use-total-unread-count';
import { Badge } from '../ui/badge';
import JttNewsPage from '@/app/jtt-news/page';
import FeedbackView from './feedback-view';
import { FriendsProvider } from '../providers/friends-provider';


interface ChatLayoutProps {
  currentUser: FirebaseUser;
  initialChatId?: string | null;
}

type MainView = 'chat' | 'feedback';

export default function ChatLayout({ currentUser, initialChatId }: ChatLayoutProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();
  const totalUnreadCount = useTotalUnreadCount(currentUser.uid);
  const [mainView, setMainView] = useState<MainView>('chat');

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default' && currentUser.uid) {
      requestNotificationPermission(currentUser.uid);
    }
  }, [currentUser.uid]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setMainView('chat');
  };

  useEffect(() => {
    const fetchInitialChat = async () => {
        if (initialChatId && !selectedChat) {
            const chatRef = doc(db, 'chats', initialChatId);
            const chatSnap = await getDoc(chatRef);
            if (chatSnap.exists()) {
                handleSelectChat({ id: chatSnap.id, ...chatSnap.data() } as Chat);
            }
        }
    };
    fetchInitialChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId, selectedChat]);


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
  
  const handleSelectFeedback = () => {
    setSelectedChat(null);
    setMainView('feedback');
  };
  
  const handleBack = () => {
    setSelectedChat(null);
    setMainView('chat');
  };

  const isChatVisible = mainView !== 'chat' || selectedChat;

  const renderMainView = () => {
    switch (mainView) {
      case 'feedback':
        return <FeedbackView currentUser={currentUser} onBack={isMobile ? handleBack : undefined} />;
      case 'chat':
      default:
        return (
          <ChatView 
              currentUser={currentUser} 
              selectedChat={selectedChat}
              onBack={isMobile ? handleBack : undefined}
              onChatDeleted={() => setSelectedChat(null)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div className={cn(
          "flex h-full max-h-screen w-full flex-col md:w-80 md:border-r md:bg-background/80 md:backdrop-blur-xl",
          isMobile && isChatVisible && "hidden"
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
                  <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || ''} />
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
            <TabsList className="w-full grid grid-cols-3 gap-2 h-auto">
              <TabsTrigger value="contacts" className='relative'>
                Contacts
                {totalUnreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">
                    {totalUnreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="games">
                <Swords className='h-4 w-4 mr-2'/>
                Games
              </TabsTrigger>
              <TabsTrigger value="watch">
                <Clapperboard className='h-4 w-4 mr-2'/>
                VX Movies
              </TabsTrigger>
              <TabsTrigger value="news" className="col-start-1">
                  <Newspaper className='h-4 w-4 mr-2'/>
                  JTT News
              </TabsTrigger>
              <TabsTrigger value="explore">
                Explore
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <MessageSquareQuote className='h-4 w-4 mr-2' />
                Feedback
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
              selectedChatId={selectedChat?.id}
              onSelectChat={handleSelectChat}
              search={search}
            />
          </TabsContent>
          <TabsContent value="games" className="flex-1 overflow-y-auto mt-0 p-0">
            <GamesBrowserPage />
          </TabsContent>
          <TabsContent value="watch" className="flex-1 overflow-y-auto mt-0 p-0">
            <VideoBrowserPage />
          </TabsContent>
          <TabsContent value="news" className="flex-1 overflow-y-auto mt-0 p-0">
            <FriendsProvider>
              <JttNewsPage />
            </FriendsProvider>
          </TabsContent>
          <TabsContent value="explore" className="flex-1 overflow-y-auto mt-0">
            <ExplorePage search={search} />
          </TabsContent>
           <TabsContent value="feedback" className="flex-1 overflow-y-auto mt-0">
             <div className="p-4 text-center text-sm text-muted-foreground">
                <p className="mb-2">Have a bug report or a feature request?</p>
                 <Button onClick={handleSelectFeedback}>
                    <MessageSquareQuote className='h-4 w-4 mr-2'/>
                    Give Feedback
                </Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className={cn("flex-1", (!isMobile || isChatVisible) ? "flex" : "hidden")}>
        {renderMainView()}
      </div>
    </div>
  );
}
