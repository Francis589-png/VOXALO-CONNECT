
'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { JttNewsPost } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatRelative } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { uploadFile } from '@/lib/pinata';
import { AlertTriangle, ExternalLink, ImagePlus, Loader2, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';

const ADMIN_EMAIL = 'jusufrancis08@gmail.com';

function CreatePostForm() {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    if (user?.email !== ADMIN_EMAIL) {
        return null;
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user) return;
        setIsLoading(true);

        try {
            const postData: DocumentData = {
                authorId: user.uid,
                authorName: user.displayName,
                authorPhotoURL: user.photoURL,
                text,
                createdAt: serverTimestamp(),
            };

            if (link.trim()) {
                postData.link = link.trim();
            }
            
            if (image) {
                const imageURL = await uploadFile(image);
                postData.imageURL = imageURL;
            }

            await addDoc(collection(db, 'jtt-news'), postData);

            setText('');
            setLink('');
            setImage(null);
            setImagePreview(null);
            toast({ title: 'Post created successfully!' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error creating post', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="What's new?"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                        rows={3}
                    />
                    <Input
                        placeholder="Optional: Add a link (e.g., https://...)"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        type="url"
                    />
                    {imagePreview && (
                         <div className="relative w-full aspect-video rounded-md overflow-hidden">
                            <Image src={imagePreview} alt="Image preview" fill objectFit="cover" />
                        </div>
                    )}
                    <div className='flex items-center gap-4'>
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <ImagePlus className="mr-2 h-4 w-4" /> Add Image
                        </Button>
                        <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <Button type="submit" disabled={isLoading} className='ml-auto'>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                             Post
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function PostCard({ post, canDelete }: { post: JttNewsPost; canDelete: boolean }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await deleteDoc(doc(db, 'jtt-news', post.id));
            toast({ title: 'Post deleted' });
        } catch (error) {
            toast({ title: 'Error deleting post', variant: 'destructive' });
        }
    };

    return (
        <Card className="overflow-hidden">
            {post.imageURL && (
                <div className="relative w-full aspect-video">
                    <Image src={post.imageURL} alt="Post image" fill objectFit="cover" />
                </div>
            )}
            <CardHeader className="flex flex-row items-center gap-3">
                <Avatar>
                    <AvatarImage src={post.authorPhotoURL} />
                    <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                        {post.createdAt ? formatRelative(post.createdAt.toDate(), new Date()) : '...'}
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{post.text}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                {post.link ? (
                     <Button asChild variant="link" className="p-0 h-auto">
                        <Link href={post.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Visit Link
                        </Link>
                    </Button>
                ) : <div />}
                {canDelete && (
                    <Button variant="ghost" size="icon" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function JttNewsPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<JttNewsPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'jtt-news'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JttNewsPost));
            setPosts(postsData);
            setIsLoading(false);
        }, (error) => {
            console.error(error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="h-full w-full bg-background chat-background">
            <ScrollArea className="h-full">
                <div className="p-4 md:p-6">
                    <div className="relative mb-8 flex h-48 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-4 text-center text-primary-foreground shadow-lg"
                         style={{ perspective: '1000px' }}>
                        <div style={{ transform: 'rotateX(15deg) translateZ(20px)', textShadow: '0 4px 15px rgba(0,0,0,0.3)'}}>
                            <h1 className="text-4xl font-bold tracking-tight">Welcome to JTT Development News</h1>
                            <p className="mt-2 text-lg opacity-80">The latest updates, right from the source.</p>
                        </div>
                    </div>
                    
                    {user && <CreatePostForm />}
                    
                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {!isLoading && posts.length === 0 && (
                        <div className="text-center text-muted-foreground py-16">
                            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">No News Yet</h3>
                            <p>Check back later for the latest updates!</p>
                        </div>
                    )}

                    <div className="grid gap-6">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} canDelete={user?.email === ADMIN_EMAIL} />
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
