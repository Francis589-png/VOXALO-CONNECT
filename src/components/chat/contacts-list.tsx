"use client";

import { UserPlus, Check, X } from 'lucide-react';
import { useFriends } from '../providers/friends-provider';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

interface ContactsListProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

export default function ContactsList({
  users,
  selectedUser,
  onSelectUser,
}: ContactsListProps) {
  const { sendFriendRequest, getFriendshipStatus, acceptFriendRequest, declineFriendRequest, friendships } = useFriends();

  const friends = friendships.map(f => f.friend);
  const friendUids = friends.map(f => f.uid);

  const friendUsers = users.filter(u => friendUids.includes(u.uid));
  const otherUsers = users.filter(u => !friendUids.includes(u.uid));


  const handleAction = (user: User) => {
    const status = getFriendshipStatus(user.uid);
    switch (status) {
      case 'not-friends':
        return (
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); sendFriendRequest(user.uid); }}>
            <UserPlus className="h-5 w-5" />
          </Button>
        );
      case 'pending-outgoing':
        return (
          <Button variant="ghost" disabled>
            Pending
          </Button>
        );
      case 'pending-incoming':
        const request = useFriends().incomingRequests.find(r => r.senderId === user.uid);
        if (!request) return null;
        return (
          <div className='flex gap-1'>
            <Button size="icon" variant="ghost" className="text-green-500" onClick={(e) => { e.stopPropagation(); acceptFriendRequest(request.id); }}>
              <Check className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-red-500" onClick={(e) => { e.stopPropagation(); declineFriendRequest(request.id); }}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        );
      case 'friends':
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      {friendUsers.map((contact) => (
        <button
          key={contact.uid}
          onClick={() => onSelectUser(contact)}
          className={`flex items-center gap-3 p-4 text-left hover:bg-muted/50 ${
            selectedUser?.uid === contact.uid ? 'bg-muted' : ''
          }`}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact.photoURL!} alt={contact.displayName!} />
            <AvatarFallback>{contact.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{contact.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
          </div>
        </button>
      ))}
       {otherUsers.length > 0 && friendUsers.length > 0 && <div className="p-2 text-sm text-muted-foreground">Other Users</div>}
      {otherUsers.map((contact) => (
        <div
          key={contact.uid}
          className={`flex items-center gap-3 p-4 text-left`}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact.photoURL!} alt={contact.displayName!} />
            <AvatarFallback>{contact.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{contact.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
          </div>
          {handleAction(contact)}
        </div>
      ))}
    </div>
  );
}
