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
} from 'lucide-react';
import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { formatRelative } from 'date-fns';

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
import { sendNotificationFlow } from '@/ai/flows/send-notification-flow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { aiChatFlow } from '@/ai/flows/ai-chat-flow';
import { Icons } from '../icons';

interface ChatViewProps {
  currentUser: FirebaseUser;
  selectedUser: User | null;
}

function ReadReceipt({
  message,
  isOwnMessage,
  recipientHasRead,
}: {
  message: Message;
  isOwnMessage: boolean;
  recipientHasRead: boolean;
}) {
  const isAiMessage = message.senderId === 'ai-assistant';
  if (!isOwnMessage || isAiMessage) return null;

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
}: {
  message: Message;
  isOwnMessage: boolean;
  recipientHasRead: boolean;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
}) {
  const date = message.timestamp?.toDate ? (message.timestamp as Timestamp).toDate() : (message.timestamp as Date);
  const formattedDate = date ? formatRelative(date, new Date()) : '';

  const renderContent = () => {
    if (message.text === '...') {
        return (
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
            </div>
        )
    }
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
    return <p className="text-sm">{message.text}</p>;
  };

  return (
    <div
      className={cn(
        'group relative flex items-end gap-2',
        isOwnMessage ? 'justify-end' : ''
      )}
    >
      <div
        className={cn(
          'max-w-md rounded-lg p-3',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card'
        )}
      >
        {renderContent()}
        <div
          className={cn(
            'flex items-center gap-2 text-xs mt-1',
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          <span>
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </span>
          <ReadReceipt
            message={message}
            isOwnMessage={isOwnMessage}
            recipientHasRead={recipientHasRead}
          />
        </div>
      </div>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
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

  const isAiAssistant = selectedUser?.uid === 'ai-assistant';

  const canChat =
    isAiAssistant || (selectedUser && friendships.some((f) => f.friend.uid === selectedUser.uid));

  const chatId =
    currentUser && selectedUser
      ? [currentUser.uid, selectedUser.uid].sort().join('_')
      : null;

  useEffect(() => {
    if (selectedUser) {
      if (isAiAssistant) {
        setSelectedUserData(selectedUser);
      } else {
        const userDocRef = doc(db, 'users', selectedUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setSelectedUserData(docSnap.data() as User);
          }
        });
        return () => unsubscribe();
      }
    }
  }, [selectedUser, isAiAssistant]);
  
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }
  
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .filter(msg => !msg.deletedFor?.includes(currentUser.uid));
        
      setMessages(messagesData);
  
      if (!isAiAssistant) {
        messagesData.forEach((message) => {
          if (
            message.senderId === selectedUser.uid &&
            !message.readBy?.includes(currentUser.uid)
          ) {
            const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
            updateDoc(messageRef, {
              readBy: arrayUnion(currentUser.uid),
            });
          }
        });
      }
    });
  
    return () => unsubscribe();
  }, [chatId, currentUser.uid, selectedUser?.uid, isAiAssistant]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        const viewport =
          scrollAreaRef.current?.querySelector(
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
    const currentMessage = newMessage.trim();
    if (!currentMessage && !audioBlob) return;

    if (!chatId || !selectedUser) return;

    let messageData: Partial<Message>;

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
    
    if (isAiAssistant) {
        // Add a temporary thinking message
        const thinkingMessage: Message = {
            id: `ai-thinking-${Date.now()}`,
            text: '...',
            senderId: 'ai-assistant',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            const historySnapshot = await getDocs(query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc')));
            
            // Convert Timestamps to ISO strings to make them serializable
            const history = historySnapshot.docs.map(doc => {
                const data = doc.data() as Message;
                const timestamp = data.timestamp as Timestamp;
                return {
                    ...data,
                    id: doc.id,
                    timestamp: timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString(),
                };
            });

            const { response } = await aiChatFlow({ 
                history,
                message: currentMessage
            });
            
            const aiMessage: Partial<Message> = {
                text: response,
                senderId: 'ai-assistant',
                timestamp: serverTimestamp(),
                readBy: [],
                deletedFor: [],
            };
            await addDoc(collection(db, 'chats', chatId, 'messages'), aiMessage);

        } catch (error) {
            console.error("AI chat failed:", error);
            const errorMessage: Partial<Message> = {
                text: "Sorry, I couldn't process that. Please try again.",
                senderId: 'ai-assistant',
                timestamp: serverTimestamp(),
            };
            await addDoc(collection(db, 'chats', chatId, 'messages'), errorMessage);
        } finally {
            // Remove thinking message by ID
            setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));
        }
    } else {
        // This is a human-to-human message
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
              timestamp: messageData.timestamp,
            },
          },
          { merge: true }
        );

        if (selectedUserData?.fcmToken) {
            try {
                await sendNotificationFlow({
                    recipientToken: selectedUserData.fcmToken,
                    title: currentUser.displayName || 'New Message',
                    body: messageData.text || `Sent a ${messageData.fileType?.split('/')[0] || 'file'}.`,
                });
            } catch (error) {
                console.error('Failed to send notification via server flow:', error);
                toast({
                    title: 'Notification Error',
                    description: 'Could not send notification.',
                    variant: 'destructive',
                });
            }
        }
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !selectedUser || isAiAssistant) return;

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
      const messageData = {
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        deletedFor: arrayUnion(currentUser.uid)
    });
  }

  const handleDeleteForEveryone = async (messageId: string) => {
    if (!chatId) return;
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(messageRef);
  }

  if (!selectedUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-card/50">
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
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex items-center gap-4 border-b p-4">
        <Avatar className="h-10 w-10">
          {isAiAssistant ? (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/20 text-primary">
                <Icons.bot className="h-6 w-6" />
            </div>
          ) : (
            <>
              <AvatarImage
                src={selectedUser.photoURL!}
                alt={selectedUser.displayName!}
              />
              <AvatarFallback>{selectedUser.displayName?.[0]}</AvatarFallback>
            </>
          )}
        </Avatar>
        <h2 className="text-lg font-semibold">{selectedUser.displayName}</h2>
      </div>
      {canChat ? (
        <>
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-6 space-y-1">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUser.uid;
                const recipientHasRead =
                  !isAiAssistant &&
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
                  />
                );
              })}
            </div>
          </ScrollArea>
          {uploading && <Progress value={uploadProgress} className="h-1 w-full" />}
          <div className="border-t p-4">
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
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isRecording ? 'Recording...' : 'Type a message...'}
                autoComplete="off"
                disabled={isRecording || !!audioBlob}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isAiAssistant}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || !!audioBlob || isAiAssistant}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={isRecording ? 'destructive' : 'ghost'}
                onClick={handleMicClick}
                disabled={!!audioBlob || isAiAssistant}
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
        <div className="flex h-full flex-col items-center justify-center bg-card/50">
          <div className="text-center">
            <p className="text-muted-foreground">
              You are not friends with this user yet.
            </p>
            <p className="text-muted-foreground">
              Accept their friend request to start chatting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
