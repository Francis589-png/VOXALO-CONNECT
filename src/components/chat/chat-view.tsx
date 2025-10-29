'use client';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatRelative } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import type { Message, User } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useFriends } from '../providers/friends-provider';

interface ChatViewProps {
  currentUser: FirebaseUser;
  selectedUser: User | null;
}

function MessageBubble({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
  const date = (message.timestamp as Timestamp)?.toDate();
  const formattedDate = date ? formatRelative(date, new Date()) : '';

  return (
    <div className={cn('flex items-end gap-2', isOwnMessage ? 'justify-end' : '')}>
      <div
        className={cn(
          'max-w-md rounded-lg p-3',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card'
        )}
      >
        <p className="text-sm">{message.text}</p>
        <p className={cn('text-xs mt-1', isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </p>
      </div>
    </div>
  );
}

export default function ChatView({ currentUser, selectedUser }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { friendships } = useFriends();

  const canChat = selectedUser && friendships.some(f => f.friend.uid === selectedUser.uid);

  const chatId =
    currentUser && selectedUser
      ? [currentUser.uid, selectedUser.uid].sort().join('_')
      : null;

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to scroll to bottom.
        // Direct scrollIntoView was not working reliably with ScrollArea component
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages, selectedUser]);
  

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !selectedUser) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    };
    await addDoc(messagesRef, messageData);

    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      users: [currentUser.uid, selectedUser.uid],
      userInfos: [
        { uid: currentUser.uid, displayName: currentUser.displayName, email: currentUser.email, photoURL: currentUser.photoURL },
        { uid: selectedUser.uid, displayName: selectedUser.displayName, email: selectedUser.email, photoURL: selectedUser.photoURL },
      ],
      lastMessage: messageData,
    }, { merge: true });

    setNewMessage('');
  };

  if (!selectedUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-card/50">
        <div className="text-center">
            <MessageCircleIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-2 text-2xl font-semibold">VoxaLo Connect</h2>
            <p className="mt-2 text-muted-foreground">Select a contact to start a conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex items-center gap-4 border-b p-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={selectedUser.photoURL!} alt={selectedUser.displayName!} />
          <AvatarFallback>{selectedUser.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">{selectedUser.displayName}</h2>
      </div>
        {canChat ? (
            <>
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-6 space-y-4">
                        {messages.map((message) => (
                            <MessageBubble
                            key={message.id}
                            message={message}
                            isOwnMessage={message.senderId === currentUser.uid}
                            />
                        ))}
                    </div>
                </ScrollArea>
                <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-5 w-5" />
                    </Button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex h-full flex-col items-center justify-center bg-card/50">
                <div className="text-center">
                    <p className="text-muted-foreground">You are not friends with this user yet.</p>
                    <p className="text-muted-foreground">Accept their friend request to start chatting.</p>
                </div>
            </div>
        )}
    </div>
  );
}


function MessageCircleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
      </svg>
    )
  }
