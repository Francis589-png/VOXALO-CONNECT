'use client';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Send,
  Trash2,
  Check,
  CheckCheck,
  MessageCircleIcon,
  MoreHorizontal,
  Trash,
  Smile,
  Mic,
  StopCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { format, formatRelative, isToday } from 'date-fns';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import type { Message, User, Chat } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useFriends } from '../providers/friends-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { uploadFile } from '@/lib/pinata';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ChatViewProps {
  currentUser: FirebaseUser;
  selectedChat: Chat | null;
}

function ReadReceipt({
  isOwnMessage,
  readBy,
  chat,
}: {
  isOwnMessage: boolean;
  readBy: string[] | undefined;
  chat: Chat;
}) {
  if (!isOwnMessage) return null;

  const allRead = chat.users.every(
    (userId) => userId === isOwnMessage || readBy?.includes(userId)
  );

  if (allRead) {
    return <CheckCheck className="h-4 w-4 text-blue-500" />;
  }
  
  if(readBy && readBy.length > 0) {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  }

  return <Check className="h-4 w-4 text-muted-foreground" />;
}

function MessageBubble({
  message,
  isOwnMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  onReact,
  currentUser,
  chat,
  sender,
}: {
  message: Message;
  isOwnMessage: boolean;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  currentUser: FirebaseUser;
  chat: Chat;
  sender: User | undefined;
}) {
  const date = (message.timestamp as any)?.toDate
    ? (message.timestamp as any).toDate()
    : new Date();
  const formattedDate = date
    ? formatRelative(date, new Date())
    : '';

  const renderContent = () => {
    if (message.type === 'audio' && message.audioURL) {
      return (
        <audio controls src={message.audioURL} className="w-64" />
      );
    }
    return <p className="text-sm break-words">{message.text}</p>;
  };

  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
       {!isOwnMessage && chat.isGroup && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={sender?.photoURL || undefined} alt={sender?.displayName || ''} />
            <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
        </Avatar>
       )}
      <div
        className={cn(
          'max-w-md rounded-lg p-2.5 flex flex-col',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card',
          chat.isGroup && !isOwnMessage ? 'rounded-tl-none' : '',
          chat.isGroup && isOwnMessage ? 'rounded-tr-none' : '',
        )}
      >
        <div className="relative">
             {chat.isGroup && !isOwnMessage && (
                <p className="text-xs font-semibold mb-1 text-primary">{sender?.displayName}</p>
            )}
            {renderContent()}
            {hasReactions && (
                <div className={cn("absolute -bottom-3 flex gap-1 p-0.5 rounded-full bg-card border shadow-sm", isOwnMessage ? "right-2" : "left-2")}>
                    {Object.entries(message.reactions!).map(([emoji, uids]) => (
                        uids.length > 0 && <div key={emoji} className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-muted">
                            <span>{emoji}</span>
                            <span className="font-medium text-muted-foreground">{uids.length}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div
          className={cn(
            'flex items-center gap-2 text-xs mt-1 self-end',
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground',
            hasReactions ? 'pt-2' : ''
          )}
        >
          <span>
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </span>
          <ReadReceipt
            isOwnMessage={isOwnMessage}
            readBy={message.readBy}
            chat={chat}
          />
        </div>
      </div>
      <div className={cn("flex items-center opacity-0 group-hover:opacity-100 transition-opacity", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Smile className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1">
                <div className="flex gap-1">
                    {EMOJI_REACTIONS.map(emoji => (
                        <Button
                            key={emoji}
                            variant="ghost"
                            size="icon"
                            onClick={() => onReact(message.id, emoji)}
                            className={cn("h-8 w-8 text-lg rounded-full", message.reactions?.[emoji]?.includes(currentUser.uid) && "bg-muted")}
                        >
                            {emoji}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
            <DropdownMenuItem onClick={() => onDeleteForMe(message.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete for me</span>
            </DropdownMenuItem>
            {isOwnMessage && (
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => onDeleteForEveryone(message.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete for everyone</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ChatView({ currentUser, selectedChat }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { friendships } = useFriends();
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const canChat =
    selectedChat && (!selectedChat.isGroup && friendships.some(f => f.friend.uid === selectedChat.users.find(uid => uid !== currentUser.uid))) || selectedChat?.isGroup;
  
  const chatId = selectedChat?.id;

  useEffect(() => {
    if (selectedChat) {
      const chatDocRef = doc(db, 'chats', selectedChat.id);
      const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setChatData({ id: docSnap.id, ...docSnap.data() } as Chat);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedChat]);


  useEffect(() => {
      if (!currentUser?.uid) return;
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
          setCurrentUserData(docSnap.data() as User);
          }
      });
      return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (selectedChat && !selectedChat.isGroup) {
      const otherUserId = selectedChat.users.find(u => u !== currentUser.uid);
      if (otherUserId) {
        const unsub = onSnapshot(doc(db, 'users', otherUserId), (doc) => {
          setOtherUser(doc.data() as User);
        });
        return () => unsub();
      }
    } else {
        setOtherUser(null);
    }
  }, [selectedChat, currentUser.uid]);


  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
        .filter((msg) => !msg.deletedFor?.includes(currentUser.uid));

      setMessages(messagesData);

      messagesData.forEach((message) => {
        if (
          message.senderId !== currentUser.uid &&
          !message.readBy?.includes(currentUser.uid)
        ) {
          const messageRef = doc(
            db,
            'chats',
            chatId,
            'messages',
            message.id
          );
          updateDoc(messageRef, {
            readBy: arrayUnion(currentUser.uid),
          });
        }
      });
    });

    return () => unsubscribe();
  }, [chatId, currentUser.uid, chatData?.users]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector(
          'div[data-radix-scroll-area-viewport]'
        );
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [messages, selectedChat]);
  
  const addMessageToChat = async (messageData: Omit<Message, 'id' | 'timestamp' | 'text'> & { timestamp: any, text?: string, audioURL?: string }) => {
    if (!chatId) return;
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const docRef = await addDoc(messagesRef, messageData);
    
    const chatRef = doc(db, 'chats', chatId);
    const lastMessageText = messageData.type === 'audio' ? 'Audio message' : messageData.text;

    const updatePayload: any = {
        lastMessage: {
          text: lastMessageText,
          senderId: messageData.senderId,
          timestamp: serverTimestamp(),
        },
    }
    
    await updateDoc(chatRef, updatePayload);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatData) return;

    const messageData = {
        type: 'text' as const,
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        deletedFor: [],
    };
    
    setNewMessage('');
    await addMessageToChat(messageData);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm' };
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        
        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstart = () => {
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);
        };

        mediaRecorder.onstop = async () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            setIsRecording(false);
            setRecordingTime(0);
            stream.getTracks().forEach(track => track.stop());

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
            
            const audioURL = await uploadFile(audioFile);
            
            if (!chatData) return;

            const messageData = {
                type: 'audio' as const,
                audioURL,
                senderId: currentUser.uid,
                timestamp: serverTimestamp(),
                readBy: [currentUser.uid],
                deletedFor: [],
            };
            await addMessageToChat(messageData);
        };
        
        mediaRecorder.start();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    if (!chatId) return;
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      deletedFor: arrayUnion(currentUser.uid),
    });
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    if (!chatId) return;
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(messageRef);
  };
  
  const handleReact = async (messageId: string, emoji: string) => {
    if (!chatId) return;
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    const docSnap = await getDoc(messageRef);

    if (docSnap.exists()) {
        const message = docSnap.data() as Message;
        const reactions = message.reactions || {};
        const existingReaction = reactions[emoji] || [];

        if (existingReaction.includes(currentUser.uid)) {
            const newReactions = {
                ...reactions,
                [emoji]: existingReaction.filter(uid => uid !== currentUser.uid)
            };
            if(newReactions[emoji].length === 0) {
                delete newReactions[emoji];
            }
            await updateDoc(messageRef, { reactions: newReactions });

        } else {
            const newReactions = {
                ...reactions,
                [emoji]: [...existingReaction, currentUser.uid]
            };
            await updateDoc(messageRef, { reactions: newReactions });
        }
    }
  };

  const getChatName = () => {
    if (!chatData) return '';
    if (chatData.isGroup) return chatData.name;
    return otherUser?.displayName || '';
  }

  const getChatPhoto = () => {
    if (!chatData) return '';
    if (chatData.isGroup) return chatData.photoURL;
    return otherUser?.photoURL || '';
  }
  
  const getChatSubtext = () => {
    if (!chatData) return null;

    if (chatData.isGroup) {
      return `${chatData.users.length} members`;
    }
    
    if (otherUser?.status === 'online') {
        return 'Online';
    }

    if (otherUser?.lastSeen) {
        const lastSeenDate = otherUser.lastSeen.toDate();
        if (isToday(lastSeenDate)) {
            return `last seen today at ${format(lastSeenDate, 'p')}`;
        }
        return `last seen ${formatRelative(lastSeenDate, new Date())}`;
    }

    return 'Offline';
  }
  
  if (!selectedChat) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted">
        <div className="text-center">
          <MessageCircleIcon className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-2 text-2xl font-semibold">VoxaLo Connect</h2>
          <p className="mt-2 text-muted-foreground">
            Select a contact to start a conversation.
          </p>
        </div>
      </div>
    );
  }
  
  const initialOtherUser = chatData?.userInfos.find(u => u.uid !== currentUser.uid);

  return (
    <div className="flex h-full max-h-screen flex-col relative">
      {currentUserData?.chatWallpaper && (
        <Image
            src={currentUserData.chatWallpaper}
            alt="Chat wallpaper"
            fill
            objectFit="cover"
            className="absolute inset-0 z-0 opacity-20 dark:opacity-10"
        />
      )}
      <div className="flex items-center gap-4 border-b p-4 bg-background/80 backdrop-blur-sm z-10">
        <div className='relative'>
            <Avatar className="h-10 w-10">
            <AvatarImage
                src={getChatPhoto()!}
                alt={getChatName()!}
            />
            <AvatarFallback>{getChatName()?.[0]}</AvatarFallback>
            </Avatar>
            {!chatData?.isGroup && otherUser?.status === 'online' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
        </div>
        <div className='flex-1'>
          <h2 className="text-lg font-semibold">{getChatName()}</h2>
          <p className="text-sm text-muted-foreground">{getChatSubtext()}</p>
        </div>
      </div>
      {canChat ? (
        <>
          <ScrollArea className="flex-1 z-10" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUser.uid;
                const sender = chatData?.userInfos.find(u => u.uid === message.senderId);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={isOwnMessage}
                    onDeleteForMe={handleDeleteForMe}
                    onDeleteForEveryone={handleDeleteForEveryone}
                    onReact={handleReact}
                    currentUser={currentUser}
                    chat={chatData!}
                    sender={sender}
                  />
                );
              })}
            </div>
          </ScrollArea>
          <div className="border-t p-4 bg-background z-10">
            {isRecording ? (
                <div className="flex items-center gap-2">
                    <Button onClick={handleToggleRecording} size="icon" variant="destructive">
                        <StopCircle className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 text-center text-muted-foreground">
                        Recording... ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')})
                    </div>
                </div>
            ) : (
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2"
                >
                    <Input
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                        }}
                        placeholder={'Type a message...'}
                        autoComplete="off"
                    />
                    {newMessage.trim() ? (
                        <Button
                            type="submit"
                            size="icon"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button type="button" onClick={handleToggleRecording} size="icon" variant="ghost">
                            <Mic className="h-5 w-5" />
                        </Button>
                    )}
                </form>
            )}
            </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-muted/30 z-10">
          <div className="text-center p-4">
             <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={getChatPhoto()!} alt={getChatName()!} />
                <AvatarFallback>{getChatName()?.[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold">{getChatName()}</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-1">{initialOtherUser?.bio}</p>
            <p className="text-muted-foreground text-sm mt-4">
              You are not friends with this user yet.
              Accept their friend request or send one to start chatting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
