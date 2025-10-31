
'use client';

import { useEffect, useState, useTransition } from 'react';
import type { PexelsVideo, ArchiveVideo } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Video, Search as SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';

type VideoSource = 'pexels' | 'archive';

async function searchVideos(query: string, source: VideoSource): Promise<any[]> {
    if (!query) return [];
    try {
        const response = await fetch(`/api/${source}?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Could not fetch videos from ${source}:`, error);
        throw error;
    }
}

function PexelsVideoCard({ video }: { video: PexelsVideo }) {
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

function ArchiveVideoCard({ video }: { video: ArchiveVideo }) {
    const videoUrl = `https://archive.org/download/${video.identifier}/${video.identifier}.mp4`;
    const imageUrl = `https://archive.org/download/${video.identifier}/${video.identifier}.thumbs/${video.identifier}_000001.jpg`;

    return (
        <Link href={`/watch/${encodeURIComponent(videoUrl)}`} className='w-full group'>
            <Card className="flex flex-col h-full overflow-hidden">
                <div className='relative aspect-video bg-black'>
                    <Image
                        src={imageUrl}
                        alt={video.title || video.identifier}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.src = 'https://archive.org/images/glogo.png'; e.currentTarget.className='object-contain p-4'; }}
                    />
                    <div className='absolute inset-0 bg-black/30' />
                </div>
                <CardContent className="p-3 flex-1">
                    <p className="font-semibold text-sm line-clamp-2">{video.title}</p>
                    {video.year && <p className="text-xs text-muted-foreground">{video.year}</p>}
                </CardContent>
            </Card>
        </Link>
    );
}


function VideoCardSkeleton() {
    return <Skeleton className="w-full aspect-video rounded-lg" />;
}

export default function VideoBrowserPage() {
    const [videos, setVideos] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('Nature');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<VideoSource>('pexels');

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchVideos = async () => {
            if (!debouncedSearchQuery) {
                setVideos([]);
                return;
            }
            setError(null);
            startTransition(async () => {
                try {
                    const videoData = await searchVideos(debouncedSearchQuery, source);
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

        fetchVideos();
    }, [debouncedSearchQuery, source]);

    const renderContent = () => {
        if (isPending) {
            return Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />);
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
                    <Video className="h-16 w-16 mb-4" />
                    <h3 className="text-lg font-semibold">Search for Videos</h3>
                    <p>Find free stock videos to watch and share.</p>
                </div>
            )
        }
        
        const cardGridClass = source === 'pexels' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 md:grid-cols-3';

        return (
            <div className={`p-4 grid ${cardGridClass} gap-4`}>
                {videos.map((video, index) => {
                    if (source === 'pexels') {
                        return <PexelsVideoCard key={video.id} video={video as PexelsVideo} />;
                    } else {
                        return <ArchiveVideoCard key={`${video.identifier}-${index}`} video={video as ArchiveVideo} />;
                    }
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className='p-4 border-b space-y-4'>
                <Select value={source} onValueChange={(value) => setSource(value as VideoSource)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a video source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pexels">Pexels</SelectItem>
                        <SelectItem value="archive">Internet Archive</SelectItem>
                    </SelectContent>
                </Select>
                 <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search ${source === 'pexels' ? 'Pexels' : 'Internet Archive'}...`}
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {renderContent()}
            </ScrollArea>
        </div>
    );
}
