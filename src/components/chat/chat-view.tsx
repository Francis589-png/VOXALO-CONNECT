
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
  Mic,
  Pause,
  Play,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { format, formatRelative, isToday } from 'date-fns';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import type { Message, User as AppUser, Chat } from '@/types';
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
import { Progress } from '../ui/progress';
import UserProfileCard from './user-profile-card';
import { useGroupInfo } from '../providers/group-info-provider';
import { Textarea } from '../ui/textarea';


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
      ? 'text-green-500' 
      : partiallyRead 
      ? 'text-blue-500' 
      : 'text-red-500';
    
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
  const iconColor = isReadByOther ? 'text-green-500' : 'text-red-500';

  return <ReadIcon className={`h-4 w-4 ${iconColor}`} />;
}

function AudioPlayer({ src }: { src: string | Blob }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        let objectUrl: string | undefined;

        if (src instanceof Blob) {
            objectUrl = URL.createObjectURL(src);
            setAudioSrc(objectUrl);
        } else if (typeof src === 'string') {
            setAudioSrc(src);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src]);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioRef, audioSrc]);
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Number(e.target.value);
        }
    };
    
    const formatTime = (time: number) => {
        if (isNaN(time) || time === Infinity) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    if (!audioSrc) return null;

    return (
        <div className="flex items-center gap-2 w-64">
            <audio ref={audioRef} src={audioSrc} preload="metadata" className="hidden" />
            <Button onClick={togglePlayPause} size="icon" variant="ghost" className='h-9 w-9 shrink-0'>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className='flex-1 flex flex-col gap-1'>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer"
                />
                 <div className="text-xs flex justify-between">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
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
    const { type, text, imageURL, fileName, audioURL } = message.replyTo;
    if (type === 'image') return 'Image';
    if (type === 'file') return fileName || 'File';
    if (type === 'audio') return 'Voice message';
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
        case 'audio':
            return message.audioURL ? <AudioPlayer src={message.audioURL} /> : null;
        case 'text':
        default:
            return <p className="text-sm break-words">{message.text}</p>;
    }
  };

  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
  const bubblePadding = message.type === 'image' || message.type === 'audio' ? 'p-1' : 'p-2.5';
  
  if (message.deletedFor?.includes(currentUser.uid)) {
    return null;
  }

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
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
      {!isEditing && (
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
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const canChat =
    (selectedChat && (!selectedChat.isGroup && friendships.some(f => f.friend.uid === selectedChat.users.find(uid => uid !== currentUser.uid))) || selectedChat?.isGroup);
  
  const chatId = selectedChat?.id;

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = handleSendAudio;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = async () => {
      if (audioChunksRef.current.length === 0) return;
      
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = []; // Clear chunks for next recording
      
      setUploading(true);
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType });
      const audioURL = await uploadFile(audioFile);
      setUploading(false);
      
      if (!chatData) return;

      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onloadedmetadata = async () => {
        await addMessageToChat({
            type: 'audio',
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            readBy: [currentUser.uid],
            deletedFor: [],
            audioURL: audioURL,
            audioDuration: audio.duration,
        });
      };
  };

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
  }, [messages, selectedChat, searchQuery]);

  const addMessageToChat = async (messageData: Omit<Message, 'id' | 'timestamp' | 'text' | 'imageURL' | 'fileURL' | 'fileName' | 'fileSize' | 'editedAt' | 'audioURL' | 'audioDuration'> & { timestamp: any, text?: string, imageURL?: string, fileURL?: string, fileName?: string, fileSize?: number, audioURL?: string, audioDuration?: number }) => {
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
            audioURL: replyingTo.audioURL || null,
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
        case 'audio': lastMessageText = 'Voice message'; break;
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
    if (!newMessage.trim() || !chatData) return;

    const text = newMessage;
    setNewMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }


    const messageData = {
        type: 'text' as const,
        text,
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
      <div className="flex items-center gap-4 border-b p-4 bg-background/80 backdrop-blur-sm z-10">
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
                    value={searchQuery}
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
            {chatData?.isGroup && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleOpenGroupInfo}>
                            <UsersIcon className="mr-2 h-4 w-4" />
                            <span>Group Info</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
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
                    />
                    );
                })}
                </div>
             )}
          </ScrollArea>
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
            {isRecording && (
                <div className="flex items-center gap-2 mb-2 text-red-500">
                    <Mic className="h-5 w-5 animate-pulse" />
                    <span>Recording...</span>
                </div>
            )}
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
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    placeholder={'Type a message...'}
                    autoComplete="off"
                    disabled={uploading || isRecording}
                    className="bg-background/80"
                />
                {newMessage.trim() ? (
                    <Button
                        type="submit"
                        size="icon"
                        disabled={uploading || !newMessage.trim()}
                        className='shrink-0'
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="icon"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={uploading}
                        className={cn('shrink-0', isRecording && 'bg-red-500 hover:bg-red-600')}
                    >
                        <Mic className="h-5 w-5" />
                    </Button>
                )}
            </form>
            </div>
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



