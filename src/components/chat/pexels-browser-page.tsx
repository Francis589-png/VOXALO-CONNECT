
'use client';

import { useEffect, useState, useTransition } from 'react';
import type { PexelsVideo } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Video, Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { useDebounce } from '@/hooks/use-debounce';

async function searchPexels(query: string): Promise<PexelsVideo[]> {
    if (!query) return [];
    try {
        const response = await fetch(`/api/pexels?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        return data.videos;
    } catch (error) {
        console.error('Could not fetch Pexels videos:', error);
        throw error;
    }
}

function VideoCard({ video }: { video: PexelsVideo }) {
    const videoFile = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
    
    return (
        <Link href={`/watch/${encodeURIComponent(videoFile.link)}`} className='w-full group'>
            <div className='relative rounded-lg overflow-hidden aspect-video bg-black'>
                <Image 
                    src={video.image}
                    alt={video.user.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className='absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors' />
                <div className='absolute bottom-2 left-2 text-white'>
                    <p className='text-sm font-semibold'>{video.user.name}</p>
                    <p className='text-xs opacity-80'>{Math.round(video.duration)}s</p>
                </div>
            </div>
        </Link>
    );
}

function VideoCardSkeleton() {
    return <Skeleton className="w-full aspect-video rounded-lg" />;
}

export default function PexelsBrowserPage() {
    const [videos, setVideos] = useState<PexelsVideo[]>([]);
    const [searchQuery, setSearchQuery] = useState('Nature');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchVideos = async () => {
            setError(null);
            startTransition(async () => {
                try {
                    const videoData = await searchPexels(debouncedSearchQuery);
                    setVideos(videoData);
                } catch (e: any) {
                     if (e.message?.includes('Pexels API key is not configured')) {
                        setError('The Pexels API key is missing. Please add `PEXELS_API_KEY=...` to your .env file.');
                    } else {
                        setError(e.message || 'Failed to fetch videos.');
                    }
                    setVideos([]);
                }
            });
        };

        if(debouncedSearchQuery) {
            fetchVideos();
        } else {
            setVideos([]);
        }
    }, [debouncedSearchQuery]);

    const renderContent = () => {
        if (isPending) {
            return Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />);
        }
        
        if (error) {
            return (
                <div className="p-4 col-span-full">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Configuration Error</AlertTitle>
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
                    <Video className="h-16 w-16 mb-4" />
                    <h3 className="text-lg font-semibold">Search Pexels</h3>
                    <p>Find free stock videos to watch and share.</p>
                </div>
            )
        }

        return videos.map((video) => (
            <VideoCard key={video.id} video={video} />
        ));
    };

    return (
        <div className="flex flex-col h-full">
            <div className='p-4 border-b'>
                 <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Pexels for videos..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderContent()}
                </div>
            </ScrollArea>
        </div>
    );
}
