
"use client";

import { useFriends } from '../providers/friends-provider';
import type { Chat, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { getChatId } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface ContactsListProps {
  users: User[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
}

function ContactItem({ chat, isSelected, onSelectChat, currentUser }: { chat: Chat, isSelected: boolean, onSelectChat: (chat: Chat) => void, currentUser: User }) {
    const unreadCount = useUnreadCount(chat.id, currentUser?.uid);
    
    const getChatName = () => {
        if (chat.isGroup) return chat.name;
        const otherUser = chat.userInfos.find(u => u.uid !== currentUser.uid);
        return otherUser?.displayName || '';
    }

    const getChatPhoto = () => {
        if (chat.isGroup) return chat.photoURL;
        const otherUser = chat.userInfos.find(u => u.uid !== currentUser.uid);
        return otherUser?.photoURL || '';
    }

    return (
        <button
            onClick={() => onSelectChat(chat)}
            className={`flex items-center gap-3 p-4 text-left hover:bg-muted/50 w-full ${
                isSelected ? 'bg-muted' : ''
            }`}
            >
            <Avatar className="h-10 w-10">
              <AvatarImage src={getChatPhoto()!} alt={getChatName()!} />
              <AvatarFallback>
                {chat.isGroup ? <Users className="h-5 w-5" /> : getChatName()?.[0]}
                </AvatarFallback>
            </Avatar>
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
