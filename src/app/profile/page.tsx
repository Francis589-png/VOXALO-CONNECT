'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  readReceiptsEnabled: z.boolean(),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      readReceiptsEnabled: true,
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue('displayName', user.displayName || '');
      
      // Fetch user data from firestore to get readReceiptsEnabled
      const userDocRef = doc(db, 'users', user.uid);
      const { getDoc } = require('firebase/firestore');
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData && typeof userData.readReceiptsEnabled === 'boolean') {
            form.setValue('readReceiptsEnabled', userData.readReceiptsEnabled);
          } else {
            form.setValue('readReceiptsEnabled', true); // Default to true if not set
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
      });

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
        <Card className="w-full max-w-md relative">
            <CardHeader>
                <div className="absolute top-4 left-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                </div>
                <CardTitle className="text-2xl text-center pt-8">Edit Profile</CardTitle>
                <CardDescription className="text-center">Manage your account settings.</CardDescription>
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
                        <FormMessage />
                    </FormItem>

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
