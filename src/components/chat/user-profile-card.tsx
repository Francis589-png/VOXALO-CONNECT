
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFriends } from '@/components/providers/friends-provider';
import type { User } from '@/types';
import { Check, UserPlus, Ban } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle as AlertDialogTitleComponent,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import { useEffect, useState } from 'react';


interface UserProfileCardProps {
  user: User | null;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ProfileContent({ user }: { user: User }) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { getFriendshipStatus, sendFriendRequest, incomingRequests, acceptFriendRequest, declineFriendRequest } = useFriends();
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            setCurrentUserData(doc.data() as User);
        }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);
  
  if (!user || !currentUser) return null;
  
  const isBlocked = currentUserData?.blockedUsers?.includes(user.uid);
  
  const status = getFriendshipStatus(user.uid);
  const incomingRequest = incomingRequests.find(req => req.senderId === user.uid);

  const handleBlock = async () => {
    const currentUserRef = doc(db, 'users', currentUser.uid);
    await updateDoc(currentUserRef, {
      blockedUsers: arrayUnion(user.uid)
    });
    toast({ title: `${user.displayName} blocked.`});
  };

  const handleUnblock = async () => {
    const currentUserRef = doc(db, 'users', currentUser.uid);
    await updateDoc(currentUserRef, {
      blockedUsers: arrayRemove(user.uid)
    });
    toast({ title: `${user.displayName} unblocked.`});
  };

  const renderFriendshipAction = () => {
    if (isBlocked) {
      return <Button variant="outline" onClick={handleUnblock}>Unblock</Button>;
    }
    
    switch (status) {
      case 'friends':
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive"><Ban className='mr-2 h-4 w-4' /> Block</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitleComponent>Block {user.displayName}?</AlertDialogTitleComponent>
                    <AlertDialogDescription>
                        Blocked users will not be able to send you messages or friend requests. They will not be notified that you have blocked them.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBlock} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Block</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        );
      case 'pending-outgoing':
        return <Button variant="secondary" disabled>Request Sent</Button>;
      case 'pending-incoming':
        if (incomingRequest) {
            return (
                <div className='flex gap-2'>
                    <Button variant="outline" onClick={() => declineFriendRequest(incomingRequest.id)}>Decline</Button>
                    <Button onClick={() => acceptFriendRequest(incomingRequest.id)}>Accept</Button>
                </div>
            )
        }
        return null;
      case 'not-friends':
        return <Button onClick={() => sendFriendRequest(user.uid)}><UserPlus className='mr-2 h-4 w-4' /> Add Friend</Button>;
      default:
        return null;
    }
  };

  return (
    <div className='flex flex-col items-center text-center'>
        <Avatar className="h-24 w-24 mb-2">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <h2 className='text-xl font-semibold'>{user.displayName}</h2>
        <p className="text-sm text-muted-foreground mt-1">{user.statusMessage}</p>
      
      <div className="py-4 text-center">
        <p className="text-sm text-muted-foreground">{user.bio || 'No bio yet.'}</p>
      </div>
      <div className="flex justify-center">{renderFriendshipAction()}</div>
    </div>
  );
}

export default function UserProfileCard({
  user,
  children,
  open,
  onOpenChange,
}: UserProfileCardProps) {
  const isMobile = useIsMobile();
  
  if (!user) {
    return children || null;
  }

  const commonProps = {
    open,
    onOpenChange,
  };
  
  const content = <ProfileContent user={user} />;

  if (isMobile) {
    return (
      <Sheet {...commonProps}>
        {children && <SheetTrigger asChild>{children}</SheetTrigger>}
        <SheetContent side="bottom" className="rounded-t-lg p-6">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog {...commonProps}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-xs p-8">
        <DialogHeader className='sr-only'>
            <DialogTitle>{user.displayName}'s Profile</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
