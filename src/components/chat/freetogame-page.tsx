
'use client';

import { useEffect, useState } from 'react';
import type { Game } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';

async function getFreeToGameGames(): Promise<Game[]> {
    try {
        const response = await fetch('/api/games');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch free-to-play games:", error);
        // Return an empty array or handle the error as you see fit
        return [];
    }
}


function GameCard({ game }: { game: Game }) {
    return (
        <Card className='flex flex-col'>
            <CardHeader className='p-0'>
                <Image 
                    src={game.thumbnail}
                    alt={game.title}
                    width={512}
                    height={288}
                    className="object-cover rounded-t-lg"
                />
            </CardHeader>
            <CardContent className="p-4 flex-1">
                <CardTitle className='text-lg mb-2'>{game.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-3">{game.short_description}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col items-start gap-4">
                 <div className='flex items-center gap-2'>
                    <Badge variant="secondary">{game.genre}</Badge>
                    <Badge variant="outline">{game.platform}</Badge>
                 </div>
                 <Button asChild className='w-full'>
                    <a href={game.game_url} target="_blank" rel="noopener noreferrer">
                        Play Now
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}

function GameCardSkeleton() {
    return (
        <Card className='flex flex-col'>
            <Skeleton className="h-[150px] w-full rounded-t-lg" />
            <CardContent className="p-4 flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-1" />
                <Skeleton className="h-4 w-1/2 mt-1" />
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col items-start gap-4">
                 <div className='flex items-center gap-2'>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                 </div>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}

export default function FreeToGamePage() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            setError(null);
            try {
                const gamesData = await getFreeToGameGames();
                setGames(gamesData);
            } catch (e: any) {
                setError(e.message || 'Failed to fetch games.');
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    if (error) {
        return (
             <div className="p-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Could not load free games. Please check your connection and try again.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!loading && games.length === 0) {
        return (
             <div className="p-4">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Games Found</AlertTitle>
                    <AlertDescription>
                        We couldn&apos;t find any free games at the moment. Please try again later.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 grid grid-cols-1 gap-4">
                {loading 
                    ? Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)
                    : games.map(game => (
                        <GameCard key={game.id} game={game} />
                ))}
            </div>
        </ScrollArea>
    );
}
