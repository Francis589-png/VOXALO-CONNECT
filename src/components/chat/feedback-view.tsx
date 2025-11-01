
'use client';

import { ArrowLeft, Send, MessageSquareQuote, Bot, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '../ui/textarea';
import { submitFeedback } from '@/ai/flows/feedback-flow';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface FeedbackViewProps {
  currentUser: FirebaseUser;
  onBack?: () => void;
}

export default function FeedbackView({ currentUser, onBack }: FeedbackViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value;
    if (!text?.trim()) return;

    setIsLoading(true);

    try {
        await submitFeedback(text);
        setSubmitted(true);
        toast({
            title: 'Feedback Submitted!',
            description: "Thanks for your input!",
        });

    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: 'Error',
        description: 'Sorry, there was a problem submitting your feedback.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
        <div className='flex items-center justify-center h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full'>
            <MessageSquareQuote className="h-6 w-6 text-white" />
        </div>
        <div className='flex-1'>
            <h2 className="text-lg font-semibold">App Feedback</h2>
            <p className="text-sm text-muted-foreground">Help us improve VoxaLo Connect</p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className='w-full max-w-lg glass-card'>
            <CardHeader>
                <CardTitle className='flex items-center justify-center gap-2 text-xl'>
                    Submit Feedback
                </CardTitle>
            </CardHeader>
            <CardContent>
                {submitted ? (
                    <div className='text-center py-8'>
                        <h3 className='text-lg font-semibold mb-2'>Thank You!</h3>
                        <p className='text-muted-foreground mb-4'>Your feedback has been received.</p>
                        <Button onClick={() => {
                            setSubmitted(false);
                            if (inputRef.current) inputRef.current.value = '';
                        }}>Submit More Feedback</Button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmitFeedback}
                        className="flex flex-col gap-4"
                    >
                        <Textarea
                            ref={inputRef}
                            placeholder='Please provide your feedback, bug report, or feature request here...'
                            autoComplete="off"
                            disabled={isLoading}
                            className="bg-background/80 min-h-[150px]"
                            rows={6}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Feedback
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
