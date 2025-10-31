
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  
  let videoUrl = '';
  const videoParam = params.video;

  if (Array.isArray(videoParam)) {
    videoUrl = decodeURIComponent(videoParam.join('/'));
  } else if (typeof videoParam === 'string') {
    videoUrl = decodeURIComponent(videoParam);
  }

  if (!videoUrl || !videoUrl.startsWith('http')) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
            <div className='text-center'>
                <h1 className="text-2xl font-bold">Invalid Video URL</h1>
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
      <header className="flex-shrink-0 bg-black/80 backdrop-blur-sm flex items-center p-2 border-b border-white/20">
        <Button onClick={() => router.back()} variant="ghost" size="sm" className='text-white hover:text-white hover:bg-white/20'>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Videos
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <video
          src={videoUrl}
          controls
          autoPlay
          className="max-h-full max-w-full"
        />
      </main>
    </div>
  );
}
