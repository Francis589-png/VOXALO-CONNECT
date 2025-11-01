
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
  Timestamp,
  arrayRemove,
  writeBatch,
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
  Paperclip,
  FileIcon,
  ArrowLeft,
  Reply,
  X,
  User,
  Pencil,
  Users as UsersIcon,
  Search,
  Pin,
  PinOff,
  ClipboardCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { format, formatRelative, isToday } from 'date-fns';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import type { Message, User as AppUser, Chat } from '@/types';
import { cn, getMessagePreview, makeSerializable } from '@/lib/utils';
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
import { Progress } from '../ui/progress';
import UserProfileCard from './user-profile-card';
import { useGroupInfo } from '../providers/group-info-provider';
import { Textarea } from '../ui/textarea';
import { pinMessage, unpinMessage } from '@/lib/actions/chat-actions';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';


const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ChatViewProps {
  currentUser: FirebaseUser;
  selectedChat: Chat | null;
  onBack?: () => void;
  onChatDeleted: () => void;
}

function ReadReceipt({
  isOwnMessage,
  readBy,
  chat,
  userInfos,
  currentUser,
}: {
  isOwnMessage: boolean;
  readBy: string[] | undefined;
  chat: Chat;
  userInfos: AppUser[];
  currentUser: FirebaseUser;
}) {
  if (!isOwnMessage) return null;

  const otherUsersInChat = chat.users.filter(uid => uid !== currentUser.uid);
  const otherUsersWhoRead = readBy?.filter(uid => uid !== currentUser.uid) || [];

  if (chat.isGroup) {
    const sent = (readBy?.length ?? 0) <= 1 && otherUsersWhoRead.length === 0;
    const partiallyRead = otherUsersWhoRead.length > 0 && otherUsersWhoRead.length < otherUsersInChat.length;
    const allRead = otherUsersInChat.length > 0 && otherUsersWhoRead.length === otherUsersInChat.length;

    const ReadIcon = sent ? Check : CheckCheck;
    const iconColor = allRead 
      ? 'text-blue-500' 
      : partiallyRead 
      ? 'text-gray-500' 
      : 'text-muted-foreground/80';
    
    const readers = userInfos.filter(u => otherUsersWhoRead.includes(u.uid));
    return (
      <Popover>
        <PopoverTrigger asChild>
            <button disabled={readers.length === 0} className='disabled:cursor-not-allowed'>
                <ReadIcon className={`h-4 w-4 ${iconColor}`} />
            </button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-64">
            <div className='flex flex-col gap-2'>
                <p className='font-medium border-b pb-2 px-2'>Read by</p>
                <ScrollArea className='max-h-48'>
                    <div className='flex flex-col gap-1 p-1'>
                        {readers.map(user => (
                            <div key={user.uid} className="flex items-center gap-2 p-1 rounded-md">
                                <Avatar className='h-7 w-7'>
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>

                                </Avatar>
                                <span className='text-sm'>{user.displayName}</span>
                            </div>
                        ))}
                         {readers.length === 0 && <p className='text-xs text-muted-foreground text-center p-2'>No one has read this yet.</p>}
                    </div>
                </ScrollArea>
             </div>
        </PopoverContent>
      </Popover>
    );
  }

  // 1-on-1 chat logic
  const isReadByOther = otherUsersInChat.length > 0 && otherUsersWhoRead.length > 0;
  const ReadIcon = isReadByOther ? CheckCheck : Check;
  const iconColor = isReadByOther ? 'text-blue-500' : 'text-muted-foreground/80';

  return <ReadIcon className={`h-4 w-4 ${iconColor}`} />;
}

function MessageBubble({
  message,
  isOwnMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  onReact,
  onReply,
  currentUser,
  chat,
  sender,
  onSaveEdit,
  onPinMessage,
  selectionMode,
  isSelected,
  onToggleSelection,
}: {
  message: Message;
  isOwnMessage: boolean;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  currentUser: FirebaseUser;
  chat: Chat;
  sender: AppUser | undefined;
  onSaveEdit: (messageId: string, newText: string) => void;
  onPinMessage: (message: Message) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (messageId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');

  const date = (message.timestamp as any)?.toDate
    ? (message.timestamp as any).toDate()
    : new Date();
  const formattedDate = date
    ? formatRelative(date, new Date())
    : '';
    
  const getRepliedMessagePreview = () => {
    if (!message.replyTo) return null;
    const { type, text, imageURL, fileName } = message.replyTo;
    if (type === 'image') return 'Image';
    if (type === 'file') return fileName || 'File';
    return text;
  }
  
  const handleSaveEdit = () => {
    if (editText.trim() !== message.text) {
        onSaveEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  }

  const renderContent = () => {
    if (isEditing) {
        return (
            <div className='flex flex-col gap-2'>
                <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-background/80"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                        } else if (e.key === 'Escape') {
                            setIsEditing(false);
                        }
                    }}
                />
                 <div className="flex justify-end gap-2 text-xs">
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary-foreground/80" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary-foreground/80" onClick={handleSaveEdit}>Save</Button>
                 </div>
            </div>
        )
    }

    switch (message.type) {
        case 'image':
            return (
                <Image 
                    src={message.imageURL!} 
                    alt="Shared image"
                    width={300}
                    height={300}
                    className="rounded-md object-cover"
                />
            );
        case 'file':
            return (
                <a 
                    href={message.fileURL!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className='flex items-center gap-3 bg-background/50 p-3 rounded-md hover:bg-background'
                >
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                    <div className='flex-1'>
                        <p className="text-sm font-medium break-all">{message.fileName}</p>
                        <p className='text-xs text-muted-foreground'>{message.fileSize ? `${(message.fileSize / 1024).toFixed(2)} KB` : ''}</p>
                    </div>
                </a>
            );
        case 'text':
        default:
            return <p className="text-sm break-words">{message.text}</p>;
    }
  };

  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
  const bubblePadding = message.type === 'image' ? 'p-1' : 'p-2.5';
  
  if (message.deletedFor?.includes(currentUser.uid)) {
    return null;
  }
  
  const isPinned = chat.pinnedMessage?.id === message.id;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2 transition-colors',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        isPinned && !selectionMode && 'bg-primary/5 rounded-md p-2 -mx-2',
        selectionMode && 'cursor-pointer rounded-md p-2 -mx-2',
        isSelected && 'bg-primary/10'
      )}
      onClick={() => selectionMode && onToggleSelection(message.id)}
    >
       {selectionMode && (
         <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(message.id)} className={cn('mt-1', isOwnMessage ? 'ml-2' : 'mr-2')} />
       )}
       {(!isOwnMessage && chat.isGroup) && (
        <UserProfileCard user={sender}>
            <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={sender?.photoURL || undefined} alt={sender?.displayName || ''} />
                <AvatarFallback>{sender?.displayName?.[0]}</AvatarFallback>
            </Avatar>
        </UserProfileCard>
       )}
      <div
        className={cn(
          'max-w-md rounded-lg flex flex-col',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card',
          chat.isGroup && !isOwnMessage ? 'rounded-tl-none' : '',
          chat.isGroup && isOwnMessage ? 'rounded-tr-none' : '',
          bubblePadding,
        )}
      >
        <div className="relative">
            {message.replyTo && (
                <div className={cn(
                    "p-2 rounded-t-lg text-xs border-b mb-2",
                     isOwnMessage ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-muted border-border"
                )}>
                    <p className={cn(
                        "font-semibold",
                        isOwnMessage ? "text-primary-foreground" : "text-primary"
                    )}>{message.replyTo.senderId === currentUser.uid ? 'You' : message.replyTo.senderName}</p>
                    <p className="truncate opacity-80">{getRepliedMessagePreview()}</p>
                </div>
            )}
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
            hasReactions ? 'pt-2' : '',
            (message.type === 'text') && !isEditing && 'px-2.5 pb-2.5'
          )}
        >
          {message.editedAt && <span className="text-xs italic">edited</span>}
          <span>
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </span>
          <ReadReceipt
            isOwnMessage={isOwnMessage}
            readBy={message.readBy}
            chat={chat}
            userInfos={chat.userInfos}
            currentUser={currentUser}
          />
        </div>
      </div>
      {!isEditing && !selectionMode && (
         <div className={cn("flex items-center opacity-0 group-hover:opacity-100 transition-opacity", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReply(message)}>
                <Reply className="h-4 w-4" />
            </Button>
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
                <DropdownMenuItem onClick={() => onPinMessage(message)}>
                    <Pin className="mr-2 h-4 w-4" />
                    <span>Pin</span>
                </DropdownMenuItem>
                {isOwnMessage && message.type === 'text' && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}
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
      )}
    </div>
  );
}

export default function ChatView({ currentUser, selectedChat, onBack, onChatDeleted }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const deliveredSoundRef = useRef<HTMLAudioElement | null>(null);
  const previousMessagesRef = useRef<Message[]>([]);
  const { toast } = useToast();

  const { friendships } = useFriends();
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [currentUserData, setCurrentUserData] = useState<AppUser | null>(null);
  const [otherUser, setOtherUser] = useState<AppUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<AppUser | null>(null);
  const { setGroup } = useGroupInfo();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

  const canChat =
    (selectedChat && (!selectedChat.isGroup && friendships.some(f => f.friend.uid === selectedChat.users.find(uid => uid !== currentUser.uid))) || selectedChat?.isGroup);
  
  const chatId = selectedChat?.id;

  if (typeof window !== 'undefined' && !deliveredSoundRef.current) {
    deliveredSoundRef.current = new Audio('/delivered.mp3');
  }


  useEffect(() => {
    if (selectedChat) {
      const chatDocRef = doc(db, 'chats', selectedChat.id);
      const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Chat;
          setChatData(data);
          if (data.isGroup) {
            setGroup(data);
          } else {
            setGroup(null);
          }
        } else {
            onChatDeleted();
        }
      });
      return () => unsubscribe();
    }
  }, [selectedChat, currentUser.uid, setGroup, onChatDeleted]);


  useEffect(() => {
      if (!currentUser?.uid) return;
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
          setCurrentUserData(docSnap.data() as AppUser);
          }
      });
      return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (selectedChat && !selectedChat.isGroup) {
      const otherUserId = selectedChat.users.find(u => u !== currentUser.uid);
      if (otherUserId) {
        const unsub = onSnapshot(doc(db, 'users', otherUserId), (doc) => {
          setOtherUser(doc.data() as AppUser);
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

      setMessages(messagesData);

      // Delivered/Read sound logic
      if (currentUserData?.messageSentSoundEnabled && previousMessagesRef.current.length > 0 && deliveredSoundRef.current) {
        messagesData.forEach(newMessage => {
            if (newMessage.senderId === currentUser.uid) {
                const oldMessage = previousMessagesRef.current.find(m => m.id === newMessage.id);
                const oldReadByCount = oldMessage?.readBy?.length || 0;
                const newReadByCount = newMessage.readBy?.length || 0;
                if (newReadByCount > oldReadByCount && newReadByCount > 1) { // >1 because sender is in readBy
                    deliveredSoundRef.current?.play().catch(e => console.error("Error playing delivered sound:", e));
                }
            }
        })
      }
      previousMessagesRef.current = messagesData;

      messagesData.forEach((message) => {
        if (
          message.senderId !== currentUser.uid &&
          !message.readBy?.includes(currentUser.uid) &&
          !(message.deletedFor || []).includes(currentUser.uid)
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
  }, [chatId, currentUser.uid, chatData?.users, currentUserData?.messageSentSoundEnabled]);

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
  }, [messages, selectedChat, searchQuery]);

  const addMessageToChat = async (messageData: Omit<Message, 'id' | 'timestamp' | 'text' | 'imageURL' | 'fileURL' | 'fileName' | 'fileSize' | 'editedAt'> & { timestamp: any, text?: string, imageURL?: string, fileURL?: string, fileName?: string, fileSize?: number }) => {
    if (!chatId) return;
    
    let fullMessageData: any = { ...messageData };
    if (replyingTo) {
        const repliedToSender = chatData?.userInfos.find(u => u.uid === replyingTo.senderId);
        fullMessageData.replyTo = {
            messageId: replyingTo.id,
            senderId: replyingTo.senderId,
            senderName: repliedToSender?.displayName || 'Unknown User',
            text: replyingTo.text || null,
            type: replyingTo.type,
            imageURL: replyingTo.imageURL || null,
            fileName: replyingTo.fileName || null,
        };
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, fullMessageData);
    setReplyingTo(null);

    
    const chatRef = doc(db, 'chats', chatId);
    
    let lastMessageText = '';
    switch (messageData.type) {
        case 'image': lastMessageText = 'Image'; break;
        case 'file': lastMessageText = messageData.fileName || 'File'; break;
        default: lastMessageText = messageData.text || '';
    }

    if (replyingTo) {
        lastMessageText = `Replied: ${lastMessageText}`;
    }

    const updatePayload: any = {
        lastMessage: {
          text: lastMessageText,
          senderId: messageData.senderId,
          timestamp: serverTimestamp(),
          type: messageData.type,
        },
    }
    
    await updateDoc(chatRef, updatePayload);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value;
    if (!text?.trim() || !chatData) return;

    if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
    }
    
    const messageData = {
        type: 'text' as const,
        text: text,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        deletedFor: [],
    };
    await addMessageToChat(messageData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatData) return;
    
    setUploading(true);
    const fileURL = await uploadFile(file);
    setUploading(false);
    
    const messageData = {
        type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        deletedFor: [],
        ...(file.type.startsWith('image/')
            ? { imageURL: fileURL }
            : { fileURL, fileName: file.name, fileSize: file.size }
        )
    };
    
    await addMessageToChat(messageData);

    if(fileInputRef.current) {
        fileInputRef.current.value = '';
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
        const userReactions = reactions[emoji] || [];

        if (userReactions.includes(currentUser.uid)) {
            // User is removing their reaction
            await updateDoc(messageRef, {
                [`reactions.${emoji}`]: arrayRemove(currentUser.uid)
            });
        } else {
            // User is adding a reaction
            await updateDoc(messageRef, {
                [`reactions.${emoji}`]: arrayUnion(currentUser.uid)
            });
        }
    }
  };
  
  const handleSaveEdit = async (messageId: string, newText: string) => {
    if (!chatId) return;
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
        text: newText,
        editedAt: serverTimestamp(),
    });
  };
  
  const handlePinMessage = async (message: Message) => {
    if (!chatId) return;
    try {
        const serializableMessage = makeSerializable(message);
        await pinMessage(chatId, serializableMessage as Message);
        toast({ title: 'Message Pinned' });
    } catch (e: any) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to pin message.', variant: 'destructive' });
    }
  }

  const handleUnpinMessage = async () => {
    if (!chatId) return;
    try {
        await unpinMessage(chatId);
        toast({ title: 'Message Unpinned' });
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to unpin message.', variant: 'destructive' });
    }
  }


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
      const memberNames = chatData.userInfos.map(u => u.uid === currentUser.uid ? 'You' : u.displayName?.split(' ')[0]).slice(0, 3);
      return `${memberNames.join(', ')}${chatData.userInfos.length > 3 ? ` and ${chatData.userInfos.length - 3} more` : ''}`;
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

  const handleOpenProfile = (user: AppUser) => {
    setSelectedProfileUser(user);
    setIsProfileCardOpen(true);
  }

  const { setIsOpen: setIsGroupInfoOpen } = useGroupInfo();

  const handleOpenGroupInfo = () => {
    if (chatData?.isGroup) {
        setGroup(chatData);
        setIsGroupInfoOpen(true);
    }
  }

  const filteredMessages = useMemo(() => {
    if (!searchQuery) {
        return messages;
    }
    return messages.filter(msg => 
        msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);
  
  const handleToggleSelection = (messageId: string) => {
    setSelectedMessages(prev => 
        prev.includes(messageId) 
            ? prev.filter(id => id !== messageId) 
            : [...prev, messageId]
    );
  };
  
  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedMessages([]);
  };

  const handleDeleteSelected = async () => {
    if (!chatId || selectedMessages.length === 0) return;

    const batch = writeBatch(db);
    selectedMessages.forEach(messageId => {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const message = messages.find(m => m.id === messageId);
      // Only allow deleting own messages for everyone
      if (message?.senderId === currentUser.uid) {
        batch.delete(messageRef);
      } else {
        batch.update(messageRef, { deletedFor: arrayUnion(currentUser.uid) });
      }
    });

    try {
      await batch.commit();
      toast({ title: `${selectedMessages.length} messages deleted.` });
      handleCancelSelection();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete messages.', variant: 'destructive' });
    }
  };


  if (!selectedChat) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background chat-background">
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
  
  const initialOtherUser = chatData?.userInfos?.find(u => u.uid !== currentUser.uid);

  return (
    <div className="flex h-full max-h-screen flex-col relative w-full chat-background">
      {selectedProfileUser && (
        <UserProfileCard
            user={selectedProfileUser}
            open={isProfileCardOpen}
            onOpenChange={setIsProfileCardOpen}
        />
      )}
      <div className="flex flex-col border-b bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4 p-4">
            {onBack && (
                <Button onClick={onBack} variant="ghost" size="icon" className='md:hidden'>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}
            <button className='relative' onClick={() => !chatData?.isGroup && otherUser && handleOpenProfile(otherUser)}>
                <Avatar className="h-10 w-10">
                    <AvatarImage
                        src={getChatPhoto() || undefined}
                        alt={getChatName()!}
                    />
                    <AvatarFallback>{getChatName()?.[0]}</AvatarFallback>
                </Avatar>
                {!chatData?.isGroup && otherUser?.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
            </button>
            <div className='flex-1'>
                {isSearching ? (
                    <Input 
                        autoFocus
                        defaultValue={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="h-9 bg-background/80"
                    />
                ) : (
                    <>
                    <h2 className="text-lg font-semibold">{getChatName()}</h2>
                    <p className="text-sm text-muted-foreground">{getChatSubtext()}</p>
                    </>
                )}
            </div>
            <div className='flex items-center gap-2'>
                <Button variant="ghost" size="icon" onClick={() => setIsSearching(prev => !prev)}>
                    {isSearching ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {chatData?.isGroup && (
                            <DropdownMenuItem onClick={handleOpenGroupInfo}>
                                <UsersIcon className="mr-2 h-4 w-4" />
                                <span>Group Info</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setSelectionMode(true)}>
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            <span>Select Messages</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        {chatData?.pinnedMessage && !selectionMode && (
            <div className='p-2 px-4 bg-background border-b flex items-center gap-2'>
                <Pin className='h-4 w-4 text-primary shrink-0' />
                <div className='flex-1 text-xs truncate'>
                    <p className='font-semibold text-primary'>{chatData.pinnedMessage.senderId === currentUser.uid ? 'You' : chatData.userInfos.find(u => u.uid === chatData.pinnedMessage?.senderId)?.displayName}</p>
                    <p className='text-muted-foreground truncate'>{getMessagePreview(chatData.pinnedMessage)}</p>
                </div>
                <Button variant='ghost' size='icon' className='h-7 w-7' onClick={handleUnpinMessage}>
                    <X className='h-4 w-4' />
                </Button>
            </div>
        )}
      </div>
      {canChat ? (
        <>
          <ScrollArea className="flex-1 z-0" ref={scrollAreaRef}>
             {filteredMessages.length === 0 && searchQuery ? (
                <div className="text-center text-muted-foreground p-8">
                    <p>No messages found for "{searchQuery}"</p>
                </div>
             ) : (
                <div className="p-6 space-y-4">
                {filteredMessages.map((message) => {
                    if (message.deletedFor?.includes(currentUser.uid)) return null;
                    const isOwnMessage = message.senderId === currentUser.uid;
                    const sender = chatData?.userInfos?.find(u => u.uid === message.senderId);

                    return (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={isOwnMessage}
                        onDeleteForMe={handleDeleteForMe}
                        onDeleteForEveryone={handleDeleteForEveryone}
                        onReact={handleReact}
                        onReply={setReplyingTo}
                        currentUser={currentUser}
                        chat={chatData!}
                        sender={sender}
                        onSaveEdit={handleSaveEdit}
                        onPinMessage={handlePinMessage}
                        selectionMode={selectionMode}
                        isSelected={selectedMessages.includes(message.id)}
                        onToggleSelection={handleToggleSelection}
                    />
                    );
                })}
                </div>
             )}
          </ScrollArea>
          {selectionMode ? (
             <div className="flex items-center justify-between border-t p-2 bg-background/80 backdrop-blur-sm z-10">
                <Button variant="ghost" onClick={handleCancelSelection}>
                    Cancel
                </Button>
                <p className='text-sm font-medium'>{selectedMessages.length} selected</p>
                <Button 
                    variant="destructive" 
                    onClick={handleDeleteSelected}
                    disabled={selectedMessages.length === 0}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </div>
          ) : (
            <div className="border-t p-4 bg-background/80 backdrop-blur-sm z-10">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-muted p-2 rounded-t-md text-sm">
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-primary">Replying to {replyingTo.senderId === currentUser.uid ? 'yourself' : chatData?.userInfos.find(u=>u.uid === replyingTo.senderId)?.displayName}</p>
                            <p className="truncate text-muted-foreground">{replyingTo.text || replyingTo.type}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReplyingTo(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {uploading && <Progress value={undefined} className="mb-2 h-1" />}
                <form
                    onSubmit={handleSendMessage}
                    className={cn(
                        "flex items-start gap-2",
                        replyingTo && "mt-2"
                    )}
                >
                    <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                    />
                    <Button type="button" onClick={() => fileInputRef.current?.click()} size="icon" variant="ghost" disabled={uploading} className='shrink-0'>
                        <Paperclip className="h-5 w-5" />
                    </Button>

                    <Textarea
                        ref={inputRef}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder={'Type a message...'}
                        autoComplete="off"
                        disabled={uploading}
                        className="bg-background/80"
                        maxRows={5}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={uploading}
                        className='shrink-0'
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-muted/30 z-10">
          <div className="text-center p-4">
             <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={getChatPhoto() || undefined} alt={getChatName()!} />
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

    