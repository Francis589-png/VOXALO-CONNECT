
'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, DocumentData, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { JttNewsPost, Feedback, User } from '@/types';
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
import { AlertTriangle, ExternalLink, ImagePlus, Loader2, MessageSquareQuote, Send, Trash2, ShieldCheck, BanIcon, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { setUserVerification, banUser } from '@/lib/actions/user-actions';
import { useFriends } from '@/components/providers/friends-provider';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

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
            let imageURL: string | undefined;
            if (image) {
                imageURL = await uploadFile(image);
            }

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
            
            if (imageURL) {
                postData.imageURL = imageURL;
            }

            await addDoc(collection(db, 'jtt-news'), postData);

            setText('');
            setLink('');
            setImage(null);
            setImagePreview(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
            toast({ title: 'Post created successfully!' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error creating post', description: 'There was an issue uploading your post.', variant: 'destructive' });
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
                            <Image src={imagePreview} alt="Image preview" fill className="object-cover" />
                             <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7"
                                onClick={() => {
                                    setImage(null);
                                    setImagePreview(null);
                                    if(fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <div className='flex items-center justify-end gap-2'>
                        <Button size="sm" type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <ImagePlus className="mr-2 h-4 w-4" /> Add Image
                        </Button>
                        <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <Button size="sm" type="submit" disabled={isLoading || !text.trim()}>
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
                    <Image src={post.imageURL} alt="Post image" fill />
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

function FeedbackCard({ feedback }: { feedback: Feedback }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await deleteDoc(doc(db, 'feedback', feedback.id));
            toast({ title: 'Feedback deleted' });
        } catch (error) {
            toast({ title: 'Error deleting feedback', variant: 'destructive' });
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">User Feedback</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {feedback.createdAt ? formatRelative(feedback.createdAt.toDate(), new Date()) : '...'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{feedback.originalFeedback}</p>
            </CardContent>
        </Card>
    );
}

function UserManagementPanel() {
    const { user: currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const { createChat } = useFriends();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsers = async () => {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(d => d.data() as User).filter(u => u.uid !== currentUser?.uid);
            setAllUsers(usersData);
        };
        fetchUsers();
    }, [currentUser]);

    const handleVerify = async (userToVerify: User) => {
        try {
            await setUserVerification(userToVerify.uid, !userToVerify.isVerified);
            setAllUsers(prev => prev.map(u => u.uid === userToVerify.uid ? { ...u, isVerified: !u.isVerified } : u));
            toast({ title: `User ${!userToVerify.isVerified ? 'verified' : 'unverified'}.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update verification status.', variant: 'destructive' });
        }
    };

    const handleBan = async (userToBan: User) => {
        try {
            await banUser(userToBan.uid, !userToBan.isBanned);
            setAllUsers(prev => prev.map(u => u.uid === userToBan.uid ? { ...u, isBanned: !u.isBanned } : u));
            toast({ title: `User ${!userToBan.isBanned ? 'banned' : 'unbanned'}.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update ban status.', variant: 'destructive' });
        }
    };
    
    const handleMessage = async (userToMessage: User) => {
        const chat = await createChat(userToMessage);
        router.push(`/?chatId=${chat.id}`);
    }

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">User Management</h2>
            </div>
            <div className='grid gap-4'>
                {allUsers.map(user => (
                    <Card key={user.uid}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <p className="font-semibold">{user.displayName}</p>
                                        {user.isVerified && <ShieldCheck className="h-5 w-5 text-blue-500" />}
                                    </div>
                                    <p className='text-sm text-muted-foreground'>{user.email}</p>
                                </div>
                            </div>
                             {user.isBanned && <Badge variant="destructive">BANNED</Badge>}
                        </CardHeader>
                        <CardFooter className='flex gap-2'>
                            <Button size="sm" variant="outline" onClick={() => handleVerify(user)}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> {user.isVerified ? 'Unverify' : 'Verify'}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                        <BanIcon className="mr-2 h-4 w-4" /> {user.isBanned ? 'Unban' : 'Ban'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{user.isBanned ? 'Unban' : 'Ban'} {user.displayName}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {user.isBanned
                                                ? 'Unbanning this user will allow them to use the app again.'
                                                : 'Banning this user will prevent them from logging in and using the app entirely.'
                                            }
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleBan(user)} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                                            {user.isBanned ? 'Unban' : 'Ban'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button size="sm" variant="secondary" onClick={() => handleMessage(user)}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Message
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}


export default function JttNewsPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<JttNewsPost[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('news');

    const isAdmin = user?.email === ADMIN_EMAIL;

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

    useEffect(() => {
        if (!isAdmin) return;

        const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedbacksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
            setFeedbacks(feedbacksData);
        }, (error) => {
            console.error("Error fetching feedback:", error);
        });
        return () => unsubscribe();
    }, [isAdmin]);

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        switch (activeTab) {
            case 'admin':
                return <UserManagementPanel />;
            case 'feedback':
                 return (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                           <MessageSquareQuote className="h-6 w-6 text-primary" />
                           <h2 className="text-2xl font-bold">User Feedback</h2>
                        </div>
                        <div className="grid gap-6">
                            {feedbacks.map(feedback => (
                                <FeedbackCard key={feedback.id} feedback={feedback} />
                            ))}
                        </div>
                    </div>
                );
            case 'news':
            default:
                 return (
                    <div>
                        {user && <CreatePostForm />}
                         {!isLoading && posts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-16">
                                <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                                <h3 className="text-xl font-semibold">No News Yet</h3>
                                <p>Check back later for the latest updates!</p>
                            </div>
                        ) : (
                             <div className="grid gap-6">
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} canDelete={isAdmin} />
                                ))}
                            </div>
                        )}
                    </div>
                );
        }
    }


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

                    {isAdmin && (
                        <div className='flex items-center justify-center gap-2 mb-8 border-b'>
                            <Button variant={activeTab === 'news' ? 'default' : 'ghost'} onClick={() => setActiveTab('news')}>News</Button>
                            <Button variant={activeTab === 'feedback' ? 'default' : 'ghost'} onClick={() => setActiveTab('feedback')}>Feedback ({feedbacks.length})</Button>
                            <Button variant={activeTab === 'admin' ? 'default' : 'ghost'} onClick={() => setActiveTab('admin')}>Admin Panel</Button>
                        </div>
                    )}
                    
                    {renderContent()}

                </div>
            </ScrollArea>
        </div>
    );
}
