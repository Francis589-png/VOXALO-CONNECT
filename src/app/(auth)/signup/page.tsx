
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { Icons } from '@/components/icons';
import { uploadFile } from '@/lib/pinata';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  photoURL: z.string().url().optional(),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const photoURL = values.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(
        values.displayName
      )}&background=random`;

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: values.displayName,
        photoURL,
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: values.displayName,
        email: user.email,
        photoURL,
        lastSeen: serverTimestamp(),
        theme: 'system',
      });

      router.push('/');
    } catch (error: any) {
      let message = 'An unknown error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in.';
      } else if (error.message) {
        message = error.message;
      }
      
      toast({
        title: 'Sign Up Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setPhotoPreview(URL.createObjectURL(file)); // Show local preview instantly
      try {
        const uploadedUrl = await uploadFile(file);
        form.setValue('photoURL', uploadedUrl);
        setPhotoPreview(uploadedUrl); // Update preview to final URL
        toast({ title: "Avatar uploaded successfully!" });
      } catch (error) {
        toast({
            title: "Upload Failed",
            description: "Could not upload your avatar. Please try again.",
            variant: "destructive"
        });
        setPhotoPreview(null); // Clear preview on error
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-md glass-card">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
            <Icons.logo className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>Join VoxaLo Connect today!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
              control={form.control}
              name="photoURL"
              render={() => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-muted-foreground">Avatar</span>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                      disabled={isUploading}
                    />
                  </FormControl>
                  <Button asChild variant="outline" size="sm" disabled={isUploading}>
                    <label htmlFor="photo-upload">{isUploading ? 'Uploading...' : 'Choose Photo'}</label>
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
              {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating Account...' : isUploading ? 'Uploading...' : 'Sign Up'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline text-primary">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
