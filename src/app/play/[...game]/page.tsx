'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GamePlayerPage() {
  const params = useParams();
  const router = useRouter();
  
  let gameUrl = '';
  const gameParam = params.game;

  if (Array.isArray(gameParam)) {
    gameUrl = decodeURIComponent(gameParam.join('/'));
  } else if (typeof gameParam === 'string') {
    gameUrl = decodeURIComponent(gameParam);
  }

  // Some URLs might be double-encoded
  try {
    const decodedOnce = decodeURIComponent(gameUrl);
    if (decodedOnce.startsWith('http')) {
        gameUrl = decodedOnce;
    }
  } catch (e) {
    // If it fails, it's likely not double-encoded, so we use the original gameUrl
  }


  if (!gameUrl || !gameUrl.startsWith('http')) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
            <div className='text-center'>
                <h1 className="text-2xl font-bold">Invalid Game URL</h1>
                <p className="text-muted-foreground mt-2">Could not load the game. Please go back and try another one.</p>
                <Button onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black">
      <header className="flex-shrink-0 bg-card/80 backdrop-blur-sm flex items-center p-2 border-b border-border">
        <Button onClick={() => router.back()} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
        </Button>
      </header>
      <main className="flex-1">
        <iframe
          src={gameUrl}
          title="Game"
          className="h-full w-full border-0"
          allow="fullscreen; payment; autoplay; execution-while-not-rendered; cross-origin-isolated"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin"
        />
      </main>
    </div>
  );
}

    