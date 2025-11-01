
'use client';

import { ArrowLeft, Send, Sparkles, User, Image as ImageIcon, Bot } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatRelative } from 'date-fns';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { generateImage } from '@/ai/flows/image-generation-flow';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import { Textarea } from '../ui/textarea';


function MessageBubble({
  message,
  isOwnMessage,
  currentUser
}: {
  message: Message;
  isOwnMessage: boolean;
  currentUser: FirebaseUser;
}) {
  const date = new Date(message.timestamp as any);
  const formattedDate = date ? formatRelative(date, new Date()) : '';

  const renderContent = () => {
    if (message.type === 'image' && message.imageURL) {
        return (
            <Image 
                src={message.imageURL}
                alt={message.text || 'Generated image'}
                width={400}
                height={400}
                className="rounded-md object-cover"
            />
        );
    }
    return <p className="text-sm break-words">{message.text}</p>;
  }

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {isOwnMessage ? (
        <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || ''} />
            <AvatarFallback><User className='h-4 w-4'/></AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="h-8 w-8 bg-gradient-to-br from-primary to-purple-500">
            <div className='flex items-center justify-center h-full w-full'>
                <Sparkles className="h-5 w-5 text-white" />
            </div>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md rounded-lg flex flex-col',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-card',
          message.type === 'image' ? 'p-1' : 'p-3',
        )}
      >
        {renderContent()}
        <div
          className={cn(
            'flex items-center gap-2 text-xs mt-1.5 self-end',
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          <span>
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}


interface AssistantViewProps {
  currentUser: FirebaseUser;
  onBack?: () => void;
}

export default function AssistantView({ currentUser, onBack }: AssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const scrollToBottom = () => {
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
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value;
    if (!text?.trim()) return;

    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    
    setIsLoading(true);
    setIsInputDisabled(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text,
      senderId: 'user',
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
        if (text.startsWith('/imagine ')) {
            const prompt = text.substring(9);
            const imageUrl = await generateImage(prompt);
            const assistantMessage: Message = {
                id: `ai-${Date.now()}`,
                text: `Here is your image for: "${prompt}"`,
                imageURL: imageUrl,
                senderId: 'ai',
                timestamp: new Date(),
                type: 'image',
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } else {
            const responseText = await chatWithAssistant([...messages, userMessage]);
            const assistantMessage: Message = {
                id: `ai-${Date.now()}`,
                text: responseText,
                senderId: 'ai',
                timestamp: new Date(),
                type: 'text',
            };
            setMessages((prev) => [...prev, assistantMessage]);
        }
    } catch (error) {
      console.error("Error with AI assistant:", error);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        text: 'Sorry, I ran into an error. Please try again.',
        senderId: 'ai',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsInputDisabled(false);
    }
  };

  return (
    <div className="flex h-full max-h-screen flex-col relative w-full chat-background">
      <div className="flex items-center gap-4 border-b p-4 bg-background/80 backdrop-blur-sm z-10">
        {onBack && (
            <Button onClick={onBack} variant="ghost" size="icon" className='md:hidden'>
                <ArrowLeft className="h-5 w-5" />
            </Button>
        )}
        <Avatar className="h-10 w-10">
           <div className='flex items-center justify-center h-full w-full bg-gradient-to-br from-primary to-purple-500 rounded-full'>
                <Sparkles className="h-6 w-6 text-white" />
            </div>
        </Avatar>
        <div className='flex-1'>
            <h2 className="text-lg font-semibold">VoxaLo AI</h2>
            <p className="text-sm text-muted-foreground">Your personal assistant</p>
        </div>
      </div>
      
        <>
          <ScrollArea className="flex-1 z-0" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {messages.length === 0 && !isLoading && (
                  <div className='text-center text-muted-foreground pt-16'>
                    <Bot className='h-12 w-12 mx-auto mb-4' />
                    <h3 className='text-lg font-semibold'>VoxaLo AI Assistant</h3>
                    <p className='text-sm'>You can ask me anything or try generating an image!</p>
                    <p className='text-xs mt-4'>e.g., <code className='bg-muted p-1 rounded-md'>/imagine a cat wearing glasses</code></p>
                  </div>
              )}
              {messages.map((message) => {
                const isOwnMessage = message.senderId === 'user';
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={isOwnMessage}
                    currentUser={currentUser}
                  />
                );
              })}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-primary to-purple-500">
                        <div className='flex items-center justify-center h-full w-full'>
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                    </Avatar>
                    <div className="bg-card p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-0"></div>
                            <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-150"></div>
                            <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-300"></div>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4 bg-background/80 backdrop-blur-sm z-10">
            <form
                onSubmit={handleSendMessage}
                className="flex items-start gap-2"
            >
                <Textarea
                    ref={inputRef}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    placeholder='Ask VoxaLo AI or type /imagine...'
                    autoComplete="off"
                    disabled={isInputDisabled}
                    className="bg-background/80"
                    maxRows={5}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={isInputDisabled}
                    className='shrink-0'
                >
                    <Send className="h-5 w-5" />
                </Button>
            </form>
            </div>
        </>
    </div>
  );
}
