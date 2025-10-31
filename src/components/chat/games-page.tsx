
'use client';

import { Swords } from 'lucide-react';
import { Button } from '../ui/button';

export default function GamesPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-4 text-center">
        <Swords className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Games</h2>
        <p className="text-sm text-muted-foreground mb-4">
            Challenge your friends to a game.
        </p>
        <Button>
            Start New Game
        </Button>
    </div>
  );
}
