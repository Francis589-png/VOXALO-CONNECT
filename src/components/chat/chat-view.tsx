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
  updateDoc,
  arrayUnion,
  getDocs,
  deleteDoc,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Send,
  Paperclip,
  Mic,
  Trash2,
  Check,
  CheckCheck,
  MessageCircleIcon,
  MoreHorizontal,
  Trash,
  Smile,
} from 'lucide-react';
import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { formatRelative } from 'date-fns';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import type { Message, User } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useFriends } from '../providers/friends-provider';
import { uploadFile } from '@/lib/pinata';
import { Progress } from '../ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { sendNotificationFlow } from '@/ai/flows/send-notification-flow';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ChatViewProps {
  currentUser: FirebaseUser;
  selectedUser: User | null;
}

function ReadReceipt({
  isOwnMessage,
  recipientHasRead,
}: {
  isOwnMessage: boolean;
  recipientHasRead: boolean;
}) {
  if (!isOwnMessage) return null;

  if (recipientHasRead) {
    return <CheckCheck className="h-4 w-4 text-blue-500" />;
  }

  return <Check className="h-4 w-4 text-muted-foreground" />;
}

function MessageBubble({
  message,
  isOwnMessage,
  recipientHasRead,
  onDeleteForMe,
  onDeleteForEveryone,
  onReact,
  currentUser,
}: {
  message: Message;
  isOwnMessage: boolean;
  recipientHasRead: boolean;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  currentUser: FirebaseUser;
}) {
  const date = message.timestamp?.toDate
    ? (message.timestamp as Timestamp).toDate()
    : (message.timestamp as Date);
  const formattedDate = date
    ? formatRelative(date, new Date())
    : '';

  const renderContent = () => {
    if (message.fileType?.startsWith('image/')) {
      return (
        <img
          src={message.fileUrl}
          alt="uploaded content"
          className="max-w-xs rounded-md"
        />
      );
    }
    if (message.fileType?.startsWith('audio/')) {
      return <audio controls src={message.fileUrl} />;
    }
    if (message.fileUrl) {
      return (
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {message.fileName || 'View File'}
        </a>
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
      <div
        className={cn(
          'max-w-md rounded-lg p-2.5 flex flex-col',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card'
        )}
      >
        <div className="relative">
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
            recipientHasRead={recipientHasRead}
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

export default function ChatView({ currentUser, selectedUser }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { friendships } = useFriends();
  const { toast } = useToast();
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);


  const canChat =
    selectedUser &&
    friendships.some((f) => f.friend.uid === selectedUser.uid);

  const chatId =
    currentUser && selectedUser
      ? [currentUser.uid, selectedUser.uid].sort().join('_')
      : null;

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
    if (selectedUser) {
      const userDocRef = doc(db, 'users', selectedUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setSelectedUserData(docSnap.data() as User);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedUser]);

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
          message.senderId === selectedUser?.uid &&
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
  }, [chatId, currentUser.uid, selectedUser?.uid]);

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
  }, [messages, selectedUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !audioBlob) return;
    if (!chatId || !selectedUser) return;

    let messageData: Omit<Message, 'id'>;
    
    if (audioBlob) {
      setUploading(true);
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      const formData = new FormData();
      formData.append('file', audioFile);

      const result = await uploadFile(formData);

      if ('fileUrl' in result) {
        messageData = {
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
          fileUrl: result.fileUrl,
          fileType: result.fileType,
          fileName: audioFile.name,
          text: '',
          readBy: [],
          deletedFor: [],
        };
      } else {
        toast({
          title: 'Upload Failed',
          description: result.error,
          variant: 'destructive',
        });
        setUploading(false);
        return;
      }
      setAudioBlob(null);
      setUploading(false);
    } else {
      messageData = {
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        readBy: [],
        deletedFor: [],
      };
    }

    setNewMessage('');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, messageData);
    
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(
      chatRef,
      {
        users: [currentUser.uid, selectedUser.uid],
        userInfos: [
          {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          },
          {
            uid: selectedUser.uid,
            displayName: selectedUser.displayName,
            email: selectedUser.email,
            photoURL: selectedUser.photoURL,
          },
        ],
        lastMessage: {
          text:
            messageData.text ||
            `Sent a ${messageData.fileType?.split('/')[0] || 'file'}.`,
          senderId: messageData.senderId,
          timestamp: serverTimestamp(),
        },
      },
      { merge: true }
    );
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !selectedUser) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 200);

    const result = await uploadFile(formData);

    clearInterval(progressInterval);
    setUploadProgress(100);

    if ('fileUrl' in result) {
      const messageData: Omit<Message, 'id'> = {
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        fileUrl: result.fileUrl,
        fileType: result.fileType,
        fileName: file.name,
        text: '',
        readBy: [],
        deletedFor: [],
      };
      
      // Not awaiting this intentionally to provide optimistic UI
      addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
    } else {
      toast({
        title: 'Upload Failed',
        description: result.error,
        variant: 'destructive',
      });
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        toast({
          title: 'Audio Error',
          description:
            'Could not start recording. Please check microphone permissions.',
          variant: 'destructive',
        });
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
            // User is removing their reaction
            const newReactions = {
                ...reactions,
                [emoji]: existingReaction.filter(uid => uid !== currentUser.uid)
            };
            if(newReactions[emoji].length === 0) {
                delete newReactions[emoji];
            }
            await updateDoc(messageRef, { reactions: newReactions });

        } else {
            // User is adding a reaction
            const newReactions = {
                ...reactions,
                [emoji]: [...existingReaction, currentUser.uid]
            };
            await updateDoc(messageRef, { reactions: newReactions });
        }
    }
  };


  if (!selectedUser) {
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
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={selectedUser.photoURL!}
            alt={selectedUser.displayName!}
          />
          <AvatarFallback>{selectedUser.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <h2 className="text-lg font-semibold">{selectedUser.displayName}</h2>
          <p className="text-sm text-muted-foreground">{selectedUserData?.bio}</p>
        </div>
      </div>
      {canChat ? (
        <>
          <ScrollArea className="flex-1 z-10" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUser.uid;
                const recipientHasRead =
                  selectedUserData?.readReceiptsEnabled !== false &&
                  !!message.readBy?.includes(selectedUser.uid);
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={isOwnMessage}
                    recipientHasRead={recipientHasRead}
                    onDeleteForMe={handleDeleteForMe}
                    onDeleteForEveryone={handleDeleteForEveryone}
                    onReact={handleReact}
                    currentUser={currentUser}
                  />
                );
              })}
            </div>
          </ScrollArea>
          {uploading && (
            <Progress value={uploadProgress} className="h-1 w-full z-10" />
          )}
          <div className="border-t p-4 bg-background z-10">
            {audioBlob && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-muted">
                <audio
                  src={URL.createObjectURL(audioBlob)}
                  controls
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAudioBlob(null)}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            )}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isRecording ? 'Recording...' : 'Type a message...'
                }
                autoComplete="off"
                disabled={isRecording || !!audioBlob}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || !!audioBlob}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={isRecording ? 'destructive' : 'ghost'}
                onClick={handleMicClick}
                disabled={!!audioBlob}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={(!newMessage.trim() && !audioBlob) || uploading}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-muted/30 z-10">
          <div className="text-center p-4">
             <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={selectedUser.photoURL!} alt={selectedUser.displayName!} />
                <AvatarFallback>{selectedUser.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold">{selectedUser.displayName}</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-1">{selectedUserData?.bio}</p>
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
