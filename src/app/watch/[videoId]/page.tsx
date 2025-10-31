
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;

  if (!videoId) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className='text-center'>
          <h1 className="text-2xl font-bold">Invalid Video ID</h1>
          <p className="text-muted-foreground mt-2">Could not load the video. Please go back and try another one.</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black">
      <header className="flex-shrink-0 bg-card/80 backdrop-blur-sm flex items-center p-2 border-b border-black">
        <Button onClick={() => router.back()} variant="ghost" size="sm" className='text-white hover:text-white hover:bg-white/20'>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Videos
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full h-full max-w-full max-h-full aspect-video bg-black">
            <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
      </main>
    </div>
  );
}
