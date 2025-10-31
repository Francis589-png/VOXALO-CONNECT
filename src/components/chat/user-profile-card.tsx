'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useFriends } from '@/components/providers/friends-provider';
import type { User } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Check, UserPlus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface UserProfileCardProps {
  user: User | null;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ProfileContent({ user }: { user: User }) {
  const { getFriendshipStatus, sendFriendRequest, incomingRequests, acceptFriendRequest, declineFriendRequest } = useFriends();
  const status = user ? getFriendshipStatus(user.uid) : 'not-friends';

  if (!user) return null;
  
  const incomingRequest = incomingRequests.find(req => req.senderId === user.uid);

  const renderFriendshipAction = () => {
    switch (status) {
      case 'friends':
        return <Button variant="secondary" disabled><Check className="mr-2" /> Friends</Button>;
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
        return <Button onClick={() => sendFriendRequest(user.uid)}><UserPlus className='mr-2' /> Add Friend</Button>;
      default:
        return null;
    }
  };

  return (
    <>
      <SheetHeader className="text-center items-center">
        <Avatar className="h-24 w-24 mb-2">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <SheetTitle>{user.displayName}</SheetTitle>
      </SheetHeader>
      <div className="py-4 text-center">
        <p className="text-sm text-muted-foreground">{user.bio || 'No bio yet.'}</p>
      </div>
      <div className="flex justify-center">{renderFriendshipAction()}</div>
    </>
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

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children && <SheetTrigger asChild>{children}</SheetTrigger>}
        <SheetContent side="bottom" className="rounded-t-lg">
          <ProfileContent user={user} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <ProfileContent user={user} />
      </DialogContent>
    </Dialog>
  );
}
