
'use client';

import { Swords, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useFriends } from '../providers/friends-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { createCheckersGame } from '@/lib/actions/game-actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Game, User } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';

function GameItem({ game, currentUser }: { game: Game, currentUser: User }) {
    const opponent = game.playerInfos.find(p => p.uid !== currentUser.uid);
    
    if (!opponent) return null;

    const isOurTurn = game.playerAssignments[game.currentPlayer] === currentUser.uid;

    return (
        <Link href={`/game/${game.id}`} className='block w-full text-left'>
            <button className='flex items-center gap-3 p-4 text-left w-full transition-colors hover:bg-accent/50'>
                <div className="relative">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={opponent.photoURL || undefined} alt={opponent.displayName!} />
                        <AvatarFallback>
                            {opponent.displayName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{opponent.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        Checkers - {game.status === 'pending' ? `Waiting for ${opponent.displayName}` : (isOurTurn ? 'Your turn' : `${opponent.displayName}'s turn`)}
                    </p>
                </div>
            </button>
        </Link>
    )
}


export default function GamesPage() {
    const { friendships } = useFriends();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [games, setGames] = useState<Game[]>([]);

    useEffect(() => {
        if (!currentUser) return;
        
        const gamesRef = collection(db, 'games');
        const userIsPlayerQuery = query(gamesRef, where('players', 'array-contains', currentUser.uid));
        
        const unsub = onSnapshot(userIsPlayerQuery, (snap) => {
            const gamesData = snap.docs.map(d => ({id: d.id, ...d.data()}) as Game);
            gamesData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
            setGames(gamesData);
        });

        return () => unsub();
    }, [currentUser]);

    const handleStartGame = async (opponent: User) => {
        if (!currentUser) return;

        try {
            await createCheckersGame(currentUser as User, opponent);
            toast({
                title: 'Game Started!',
                description: `A game of checkers has been started with ${opponent.displayName}.`
            });
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error starting game: ", error);
            toast({
                title: 'Error',
                description: 'Could not start the game. Please try again.',
                variant: 'destructive',
            });
        }
    }
    
    const uniqueFriends = friendships.map(f => f.friend).filter((friend, index, self) =>
        index === self.findIndex((f) => f.uid === friend.uid)
    );

    return (
        <div className="flex flex-col h-full">
            <div className='p-4'>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className='w-full'>
                            <Swords className="h-4 w-4 mr-2" />
                            Start New Game
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Challenge a Friend</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-72">
                            <div className='flex flex-col gap-1 p-1'>
                                {uniqueFriends.map(friend => (
                                    <button key={friend.uid} onClick={() => handleStartGame(friend)} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent w-full text-left">
                                        <Avatar>
                                            <AvatarImage src={friend.photoURL || ''} alt={friend.displayName || ''} />
                                            <AvatarFallback>{friend.displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className='font-medium'>{friend.displayName}</span>
                                    </button>
                                ))}
                                {uniqueFriends.length === 0 && (
                                    <p className='text-sm text-muted-foreground text-center p-8'>
                                        You need friends to challenge them to a game.
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>

            {games.length > 0 ? (
                <ScrollArea className="flex-1">
                    <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
                        Active Games
                    </h2>
                    <div className='flex flex-col'>
                        {games.map(game => (
                            <GameItem key={game.id} game={game} currentUser={currentUser as User} />
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex flex-col h-full items-center justify-center p-4 text-center">
                    <Swords className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-lg font-semibold">No Active Games</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Challenge a friend to a game of checkers.
                    </p>
                </div>
            )}
        </div>
    );
}
