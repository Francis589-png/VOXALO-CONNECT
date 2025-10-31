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
import { Check, UserPlus } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';


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
    <div className='flex flex-col items-center text-center'>
        <Avatar className="h-24 w-24 mb-2">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <DialogTitle>{user.displayName}</DialogTitle>
      
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
        {content}
      </DialogContent>
    </Dialog>
  );
}
