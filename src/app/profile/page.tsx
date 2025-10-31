
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Moon, Sun, Monitor, User as UserIcon, Upload } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { uploadFile } from '@/lib/pinata';


const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  statusMessage: z.string().max(50, { message: 'Status must be 50 characters or less.' }).optional(),
  readReceiptsEnabled: z.boolean(),
  notificationSounds: z.boolean(),
  bio: z.string().max(160, { message: 'Bio cannot be longer than 160 characters.' }).optional(),
  theme: z.string(),
  photo: z.instanceof(File).optional(),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  
  if (typeof window !== 'undefined' && !notificationSoundRef.current) {
    notificationSoundRef.current = new Audio('/notification.mp3');
  }


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      statusMessage: '',
      readReceiptsEnabled: true,
      notificationSounds: false,
      bio: '',
      theme: 'system',
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue('displayName', user.displayName || '');
      setPhotoPreview(user.photoURL);
      
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData) {
            form.setValue('readReceiptsEnabled', userData.readReceiptsEnabled ?? true);
            form.setValue('notificationSounds', userData.notificationSounds ?? false);
            form.setValue('bio', userData.bio || '');
            form.setValue('statusMessage', userData.statusMessage || '');
            form.setValue('theme', userData.theme || 'system');
          }
        }
      });
    }
  }, [user, form]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to update your profile.', variant: 'destructive'});
      return;
    }

    setIsLoading(true);
    try {
      let photoURL = user.photoURL;
      if (values.photo) {
        photoURL = await uploadFile(values.photo);
      }

      await updateProfile(user, {
        displayName: values.displayName,
        photoURL,
      });

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: values.displayName,
        photoURL,
        statusMessage: values.statusMessage,
        readReceiptsEnabled: values.readReceiptsEnabled,
        notificationSounds: values.notificationSounds,
        bio: values.bio,
        theme: values.theme,
      });

      setTheme(values.theme);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      router.push('/');

    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 chat-background">
        <Card className="w-full max-w-lg relative glass-card">
            <CardHeader>
                <div className="absolute top-4 left-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                </div>
                <CardTitle className="text-2xl text-center pt-8">Edit Profile</CardTitle>
                <CardDescription className="text-center">Manage your account settings and preferences.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className='flex justify-center'>
                       <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-muted">
                                <AvatarImage src={photoPreview || undefined} alt="Profile Picture" />
                                <AvatarFallback className="bg-muted">
                                    <UserIcon className="h-16 w-16 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="absolute bottom-2 right-2 rounded-full h-8 w-8 bg-background/80 group-hover:bg-background"
                                onClick={() => photoInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4" />
                            </Button>
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={photoInputRef}
                              onChange={handlePhotoChange}
                            />
                        </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                              <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="statusMessage"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                              <Input placeholder="What's on your mind?" {...field} />
                          </FormControl>
                          <FormDescription>A short status message shown on your profile.</FormDescription>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder={user.email!} disabled />
                        </FormControl>
                    </FormItem>
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                              <Textarea placeholder="Tell us a little bit about yourself" {...field} />
                          </FormControl>
                          <FormDescription>A brief description of yourself. Shown on your profile.</FormDescription>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    
                    <Separator />

                    <div>
                        <h3 className="text-lg font-medium">Appearance</h3>
                        <p className="text-sm text-muted-foreground">Customize the look and feel of the app.</p>
                    </div>

                     <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Theme</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-3 gap-4"
                                    >
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="light" className="sr-only" id="light" />
                                            </FormControl>
                                            <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                                <Sun className="mb-3 h-6 w-6" />
                                                Light
                                            </Label>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="dark" className="sr-only" id="dark" />
                                            </FormControl>
                                            <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                                <Moon className="mb-3 h-6 w-6" />
                                                Dark
                                            </Label>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="system" className="sr-only" id="system" />
                                            </FormControl>
                                            <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                                <Monitor className="mb-3 h-6 w-6" />
                                                System
                                            </Label>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <Separator />
                    
                    <FormField
                        control={form.control}
                        name="readReceiptsEnabled"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Read Receipts</FormLabel>
                                    <FormDescription>
                                        Allow others to see when you've read their messages.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notificationSounds"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Notification Sounds</FormLabel>
                                    <FormDescription>
                                        Play a sound for new message notifications.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if (checked && notificationSoundRef.current) {
                                            notificationSoundRef.current.play().catch(e => console.error("Error playing notification sound:", e));
                                        }
                                    }}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />


                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
    </main>
  );
}
