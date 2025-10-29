
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
  getDoc
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Send, Paperclip, Mic, Trash2, Check, CheckCheck, MessageCircleIcon } from 'lucide-react';
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
import { sendNotification } from '@/lib/fcm';

interface ChatViewProps {
  currentUser: FirebaseUser;
  selectedUser: User | null;
}

function ReadReceipt({ message, isOwnMessage, recipientHasRead }: { message: Message; isOwnMessage: boolean; recipientHasRead: boolean; }) {
    if (!isOwnMessage) return null;

    if (recipientHasRead) {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    
    return <Check className="h-4 w-4 text-muted-foreground" />;
}

function MessageBubble({ message, isOwnMessage, recipientHasRead }: { message: Message; isOwnMessage: boolean, recipientHasRead: boolean; }) {
  const date = (message.timestamp as Timestamp)?.toDate();
  const formattedDate = date ? formatRelative(date, new Date()) : '';

  const renderContent = () => {
    if (message.fileType?.startsWith('image/')) {
      return <img src={message.fileUrl} alt="uploaded content" className="max-w-xs rounded-md" />;
    }
    if (message.fileType?.startsWith('audio/')) {
      return <audio controls src={message.fileUrl} />;
    }
    if (message.fileUrl) {
      return (
        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
          {message.fileName || 'View File'}
        </a>
      );
    }
    return <p className="text-sm">{message.text}</p>;
  };

  return (
    <div className={cn('flex items-end gap-2', isOwnMessage ? 'justify-end' : '')}>
      <div
        className={cn(
          'max-w-md rounded-lg p-3',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card'
        )}
      >
        {renderContent()}
        <div className={cn('flex items-center gap-2 text-xs mt-1', isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            <span>{formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}</span>
            <ReadReceipt message={message} isOwnMessage={isOwnMessage} recipientHasRead={recipientHasRead} />
        </div>
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

  const canChat = selectedUser && friendships.some(f => f.friend.uid === selectedUser.uid);

  const chatId =
    currentUser && selectedUser
      ? [currentUser.uid, selectedUser.uid].sort().join('_')
      : null;

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
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(messagesData);

      // Mark messages as read
      if (selectedUserData?.readReceiptsEnabled !== false) { // check if enabled, default to true
        messagesData.forEach(message => {
            if (message.senderId === selectedUser?.uid && !message.readBy?.includes(currentUser.uid)) {
                const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
                updateDoc(messageRef, {
                    readBy: arrayUnion(currentUser.uid)
                });
            }
        });
      }
    });

    return () => unsubscribe();
  }, [chatId, currentUser.uid, selectedUser?.uid, selectedUserData?.readReceiptsEnabled]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages, selectedUser]);
  
  const sendMessage = async (messageData: any) => {
    if (!chatId || !selectedUser) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, messageData);

    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      users: [currentUser.uid, selectedUser.uid],
      userInfos: [
        { uid: currentUser.uid, displayName: currentUser.displayName, email: currentUser.email, photoURL: currentUser.photoURL },
        { uid: selectedUser.uid, displayName: selectedUser.displayName, email: selectedUser.email, photoURL: selectedUser.photoURL },
      ],
      lastMessage: {
        text: messageData.text || `Sent a ${messageData.fileType?.split('/')[0] || 'file'}.`,
        senderId: messageData.senderId,
        timestamp: messageData.timestamp
      },
    }, { merge: true });

    if (selectedUserData) {
      await sendNotification(selectedUserData, messageData, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !audioBlob) || !chatId || !selectedUser) return;

    let messageData: any;

    if (audioBlob) {
        setUploading(true);
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
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
            };
        } else {
            toast({ title: 'Upload Failed', description: result.error, variant: 'destructive' });
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
        };
    }
    
    await sendMessage(messageData);
    setNewMessage('');
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !selectedUser) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    
    // Simulate progress for UX
    const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
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
        };
        await sendMessage(messageData);
    } else {
        toast({ title: 'Upload Failed', description: result.error, variant: 'destructive' });
    }

    setUploading(false);
    setUploadProgress(0);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

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
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        toast({ title: 'Audio Error', description: 'Could not start recording. Please check microphone permissions.', variant: 'destructive' });
      }
    }
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
                        {messages.map((message) => {
                            const isOwnMessage = message.senderId === currentUser.uid;
                            const recipientHasRead = selectedUserData?.readReceiptsEnabled !== false && !!message.readBy?.includes(selectedUser.uid);
                            return (
                                <MessageBubble
                                key={message.id}
                                message={message}
                                isOwnMessage={isOwnMessage}
                                recipientHasRead={recipientHasRead}
                                />
                            )
                        })}
                    </div>
                </ScrollArea>
                {uploading && <Progress value={uploadProgress} className="h-1 w-full" />}
                <div className="border-t p-4">
                    {audioBlob && (
                        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-muted">
                            <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1" />
                            <Button variant="ghost" size="icon" onClick={() => setAudioBlob(null)}>
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isRecording ? "Recording..." : "Type a message..."}
                            autoComplete="off"
                            disabled={isRecording || !!audioBlob}
                        />
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isRecording || !!audioBlob}>
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Button type="button" size="icon" variant={isRecording ? "destructive" : "ghost"} onClick={handleMicClick} disabled={!!audioBlob}>
                            <Mic className="h-5 w-5" />
                        </Button>
                        <Button type="submit" size="icon" disabled={(!newMessage.trim() && !audioBlob) || uploading}>
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

    