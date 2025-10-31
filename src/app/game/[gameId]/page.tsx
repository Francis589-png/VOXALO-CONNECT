
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Game, User } from '@/types';
import Loading from '@/app/loading';
import { notFound, useRouter } from 'next/navigation';
import CheckersBoard from '@/components/game/checkers-board';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown } from 'lucide-react';
import Link from 'next/link';

interface PlayerDisplayProps {
    player: User;
    isCurrent: boolean;
    isWinner?: boolean;
}

function PlayerDisplay({ player, isCurrent, isWinner }: PlayerDisplayProps) {
    return (
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/80 border w-40">
             <Avatar className="h-16 w-16 border-4 border-transparent data-[current=true]:border-primary transition-all">
                <AvatarImage src={player.photoURL || undefined} alt={player.displayName!} />
                <AvatarFallback>{player.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <p className="font-semibold truncate">{player.displayName}</p>
            {isWinner && (
                <div className='flex items-center gap-1 text-yellow-500 font-bold'>
                    <Crown className='h-5 w-5' />
                    <span>Winner!</span>
                </div>
            )}
        </div>
    )
}


export default function GamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;
  const { user, loading } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        setGame({ id: docSnap.id, ...docSnap.data() } as Game);
      } else {
        setGame(null);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  if (loading || !game) {
    return <Loading />;
  }

  if (!user || !game.players.red || !game.players.black || ![game.players.red, game.players.black].includes(user.uid)) {
    return notFound();
  }
  
  const redPlayer = game.playerInfos.find(p => p.uid === game.players.red);
  const blackPlayer = game.playerInfos.find(p => p.uid === game.players.black);
  
  if(!redPlayer || !blackPlayer) return <Loading />;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 chat-background">
        <div className="absolute top-4 left-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to chats</span>
                </Link>
            </Button>
        </div>
        <div className='flex flex-col items-center gap-4'>
            <PlayerDisplay 
                player={blackPlayer} 
                isCurrent={game.currentPlayer === 'black'} 
                isWinner={game.status === 'finished' && game.winner === 'black'}
            />

            <CheckersBoard game={game} currentUser={user as User} />

             <PlayerDisplay 
                player={redPlayer} 
                isCurrent={game.currentPlayer === 'red'}
                isWinner={game.status === 'finished' && game.winner === 'red'}
            />
        </div>
    </div>
  );
}
