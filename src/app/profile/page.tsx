'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Moon, Sun, Monitor } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import ProfilePictureUploader from '@/components/profile-picture-uploader';
import { uploadFile } from '@/lib/pinata';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { wallpaperOptions } from '@/lib/wallpapers';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  readReceiptsEnabled: z.boolean(),
  bio: z.string().max(160, { message: 'Bio cannot be longer than 160 characters.' }).optional(),
  theme: z.string(),
  chatWallpaper: z.string(),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      readReceiptsEnabled: true,
      bio: '',
      theme: 'system',
      chatWallpaper: '/wallpapers/default.png',
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue('displayName', user.displayName || '');
      
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData) {
            form.setValue('readReceiptsEnabled', userData.readReceiptsEnabled ?? true);
            form.setValue('bio', userData.bio || '');
            form.setValue('theme', userData.theme || 'system');
            form.setValue('chatWallpaper', userData.chatWallpaper || '/wallpapers/default.png');
          }
        }
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to update your profile.', variant: 'destructive'});
      return;
    }

    setIsLoading(true);
    try {
      let photoURL = user.photoURL;

      if (profilePicture) {
        const formData = new FormData();
        formData.append('file', profilePicture);
        const result = await uploadFile(formData);

        if ('fileUrl' in result) {
          photoURL = result.fileUrl;
        } else {
          throw new Error(result.error || 'Failed to upload profile picture.');
        }
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: values.displayName,
        photoURL,
      });

      // Update user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: values.displayName,
        photoURL,
        readReceiptsEnabled: values.readReceiptsEnabled,
        bio: values.bio,
        theme: values.theme,
        chatWallpaper: values.chatWallpaper,
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
    return null; // Or a loading spinner
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-lg relative">
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
                        <ProfilePictureUploader 
                            onPictureChange={setProfilePicture}
                            initialImageUrl={user.photoURL}
                        />
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
                        <h3 className="text-lg font-medium">Theme</h3>
                        <p className="text-sm text-muted-foreground">Select your preferred application theme.</p>
                    </div>

                    <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
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
                    
                    <div>
                        <h3 className="text-lg font-medium">Chat Wallpaper</h3>
                        <p className="text-sm text-muted-foreground">Choose a background for your chats.</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="chatWallpaper"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-3 sm:grid-cols-4 gap-4"
                            >
                              {wallpaperOptions.map((wallpaper) => (
                                <FormItem key={wallpaper.value}>
                                  <FormControl>
                                    <RadioGroupItem value={wallpaper.value} id={wallpaper.value} className="sr-only" />
                                  </FormControl>
                                  <Label
                                    htmlFor={wallpaper.value}
                                    className={cn(
                                      "block w-full h-24 rounded-md border-2 border-muted overflow-hidden cursor-pointer",
                                      "hover:border-primary focus:border-primary",
                                      field.value === wallpaper.value && "border-primary ring-2 ring-primary"
                                    )}
                                  >
                                    <Image
                                      src={wallpaper.thumbnail}
                                      alt={wallpaper.name}
                                      width={100}
                                      height={100}
                                      className="w-full h-full object-cover"
                                    />
                                  </Label>
                                </FormItem>
                              ))}
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

    