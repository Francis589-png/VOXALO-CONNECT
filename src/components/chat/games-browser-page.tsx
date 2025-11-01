
'use client';

import { useEffect, useState } from 'react';
import type { Game, GameMonetizeGame } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type GameSource = 'freetogame' | 'gamemonetize';

async function getGames(source: GameSource): Promise<any[]> {
    try {
        const response = await fetch(`/api/${source === 'freetogame' ? 'games' : 'gamemonetize'}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // The gamemonetize API returns an object with a games property, freetogame returns an array
        return source === 'gamemonetize' ? data : data;
    } catch (error) {
        console.error(`Could not fetch games from ${source}:`, error);
        return [];
    }
}


function GameCard({ game, source }: { game: Game | GameMonetizeGame; source: GameSource }) {
    const isFreeToGame = source === 'freetogame';
    const g = game as any;

    const thumbnailUrl = isFreeToGame ? g.thumbnail : g.thumb;
    const title = g.title;
    const description = isFreeToGame ? g.short_description : g.description;
    const gameUrl = isFreeToGame ? g.game_url : g.url;
    
    return (
        <Card className='flex flex-col'>
            <CardHeader className='p-0'>
                <Image 
                    src={thumbnailUrl}
                    alt={title}
                    width={512}
                    height={288}
                    className="object-cover rounded-t-lg aspect-[16/9]"
                />
            </CardHeader>
            <CardContent className="p-4 flex-1">
                <CardTitle className='text-lg mb-2'>{title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col items-start gap-4">
                 <div className='flex items-center gap-2 flex-wrap'>
                    {isFreeToGame ? (
                        <>
                            <Badge variant="secondary">{g.genre}</Badge>
                            <Badge variant="outline">{g.platform}</Badge>
                        </>
                    ) : (
                        g.category && <Badge variant="secondary">{g.category}</Badge>
                    )}
                 </div>
                 <Button asChild className='w-full'>
                    <Link href={`/play/${encodeURIComponent(gameUrl)}`}>
                        Play Now
                    </Link>
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

export default function GamesBrowserPage() {
    const [games, setGames] = useState<(Game | GameMonetizeGame)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<GameSource>('freetogame');

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            setError(null);
            try {
                const gamesData = await getGames(source);
                setGames(gamesData);
            } catch (e: any) {
                setError(e.message || 'Failed to fetch games.');
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [source]);

    const renderContent = () => {
        if (loading) {
            return Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />);
        }
        
        if (error) {
            return (
                <div className="p-4 col-span-full">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            Could not load games. Please check your connection and try again.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }
        
        const validGames = games.filter(game => {
            const g = game as any;
            const thumbnailUrl = source === 'freetogame' ? g.thumbnail : g.thumb;
            return thumbnailUrl && typeof thumbnailUrl === 'string';
        });

        if (validGames.length === 0) {
            return (
                 <div className="p-4 col-span-full">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Games Found</AlertTitle>
                        <AlertDescription>
                            We couldn&apos;t find any games from this source at the moment. Please try again later.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }
        
        return validGames.map((game, index) => (
            <GameCard key={`${source}-${(game as any).id}-${index}`} game={game} source={source} />
        ));
    };

    return (
        <div className="flex flex-col h-full">
            <div className='p-4 border-b'>
                <Select value={source} onValueChange={(value) => setSource(value as GameSource)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a game source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="freetogame">FreeToGame</SelectItem>
                        <SelectItem value="gamemonetize">GameMonetize</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderContent()}
                </div>
            </ScrollArea>
        </div>
    );
}

    