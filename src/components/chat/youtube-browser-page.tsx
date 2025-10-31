
'use client';

import { useEffect, useState, useTransition } from 'react';
import type { YouTubeVideo } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Youtube, Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDistanceToNow } from 'date-fns';

async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
    if (!query) return [];
    try {
        const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Could not fetch YouTube videos:', error);
        return [];
    }
}

function VideoCard({ video }: { video: YouTubeVideo }) {
    return (
        <Link href={`/watch/${video.id.videoId}`} className='w-full'>
            <Card className='flex flex-col md:flex-row items-start gap-4 p-4 hover:bg-accent transition-colors'>
                <div className='relative flex-shrink-0'>
                    <Image 
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        width={240}
                        height={135}
                        className="object-cover rounded-lg aspect-video w-full md:w-60"
                    />
                </div>
                <div className='flex-1'>
                    <h3 className="font-semibold line-clamp-2">{video.snippet.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{video.snippet.channelTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(video.snippet.publishedAt), { addSuffix: true })}
                    </p>
                </div>
            </Card>
        </Link>
    );
}

function VideoCardSkeleton() {
    return (
        <Card className='flex flex-col md:flex-row items-start gap-4 p-4'>
            <Skeleton className="h-[135px] w-full md:w-60 rounded-lg" />
            <div className='flex-1 mt-2 md:mt-0'>
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4 mt-2" />
            </div>
        </Card>
    );
}

export default function YoutubeBrowserPage() {
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [searchQuery, setSearchQuery] = useState('Next.js tutorials');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchVideos = async () => {
            setError(null);
            startTransition(async () => {
                try {
                    const videoData = await searchYouTube(debouncedSearchQuery);
                    if (videoData.length === 0 && debouncedSearchQuery) {
                       // Check if it's an API key issue
                        const res = await fetch(`/api/youtube?q=test`);
                        if (res.status === 500) {
                            const text = await res.text();
                            if (text.includes('API key')) {
                                setError('YouTube API key is not configured correctly. Please add it to your .env file.');
                                return;
                            }
                        }
                    }
                    setVideos(videoData);
                } catch (e: any) {
                    setError(e.message || 'Failed to fetch videos.');
                }
            });
        };

        fetchVideos();
    }, [debouncedSearchQuery]);

    const renderContent = () => {
        if (isPending) {
            return Array.from({ length: 5 }).map((_, i) => <VideoCardSkeleton key={i} />);
        }
        
        if (error) {
            return (
                <div className="p-4 col-span-full">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            );
        }

        if (videos.length === 0 && debouncedSearchQuery) {
            return (
                 <div className="p-4 col-span-full text-center text-muted-foreground">
                    <p>No videos found for "{debouncedSearchQuery}".</p>
                </div>
            )
        }
        
        if (videos.length === 0 && !debouncedSearchQuery) {
            return (
                <div className="p-4 col-span-full text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                    <Youtube className="h-16 w-16 mb-4" />
                    <h3 className="text-lg font-semibold">Search YouTube</h3>
                    <p>Find videos to watch and share with your friends.</p>
                </div>
            )
        }

        return videos.map((video) => (
            <VideoCard key={video.id.videoId} video={video} />
        ));
    };

    return (
        <div className="flex flex-col h-full">
            <div className='p-4 border-b'>
                 <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search YouTube..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 grid grid-cols-1 gap-4">
                    {renderContent()}
                </div>
            </ScrollArea>
        </div>
    );
}
