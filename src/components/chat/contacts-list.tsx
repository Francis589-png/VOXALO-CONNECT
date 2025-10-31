
"use client";

import { useFriends } from '../providers/friends-provider';
import type { Chat, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { getChatId } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactsListProps {
  users: User[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
}

function ContactItem({ chat, isSelected, onSelectChat, currentUser }: { chat: Chat, isSelected: boolean, onSelectChat: (chat: Chat) => void, currentUser: User }) {
    const unreadCount = useUnreadCount(chat.id, currentUser?.uid);
    const [otherUser, setOtherUser] = useState<User | undefined>();

    useEffect(() => {
        if (chat.isGroup) return;
        const otherUserId = chat.users.find(u => u !== currentUser.uid);
        if (otherUserId) {
            const unsub = onSnapshot(doc(db, 'users', otherUserId), (doc) => {
                setOtherUser(doc.data() as User);
            });
            return () => unsub();
        }
    }, [chat, currentUser]);
    
    const getChatName = () => {
        if (chat.isGroup) return chat.name;
        return otherUser?.displayName || chat.userInfos.find(u => u.uid !== currentUser.uid)?.displayName || '';
    }

    const getChatPhoto = () => {
        if (chat.isGroup) return chat.photoURL;
        return otherUser?.photoURL || chat.userInfos.find(u => u.uid !== currentUser.uid)?.photoURL || '';
    }

    const isOnline = !chat.isGroup && otherUser?.status === 'online';

    return (
        <button
            onClick={() => onSelectChat(chat)}
            className={cn(
                'flex items-center gap-3 p-4 text-left w-full',
                isSelected ? 'bg-muted' : 'hover:bg-muted/50'
            )}
            >
            <div className="relative">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={getChatPhoto()!} alt={getChatName()!} />
                    <AvatarFallback>
                        {chat.isGroup ? <Users className="h-5 w-5" /> : getChatName()?.[0]}
                    </AvatarFallback>
                </Avatar>
                {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <div className='flex items-center justify-between'>
                    <p className="font-semibold truncate">{getChatName()}</p>
                    {unreadCount > 0 && (
                        <Badge variant="default" className="h-5 px-2 text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {chat.lastMessage?.text || (chat.isGroup ? 'Group Chat' : 'No messages yet')}
                </p>
            </div>
        </button>
    );
}


export default function ContactsList({
  selectedChat,
  onSelectChat,
}: ContactsListProps) {
  const { user: currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
        chatsData.sort((a, b) => (b.lastMessage?.timestamp as any) - (a.lastMessage?.timestamp as any));
        setChats(chatsData);
    });

    return () => unsubscribe();
  }, [currentUser]);


  if (chats.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-muted-foreground">No contacts found.</p>
            <p className="text-xs text-muted-foreground">
                Use the Explore tab to find new friends.
            </p>
        </div>
    );
  }


  return (
    <ScrollArea className="h-full">
        <div className="flex flex-col">
        {chats.map((chat) => (
            <ContactItem 
                key={chat.id} 
                chat={chat}
                isSelected={selectedChat?.id === chat.id}
                onSelectChat={onSelectChat}
                currentUser={currentUser as User}
            />
        ))}
        </div>
    </ScrollArea>
  );
}
