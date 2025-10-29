"use client";

import { useFriends } from '../providers/friends-provider';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

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
  const { friendships } = useFriends();

  const friends = friendships.map(f => f.friend).filter(Boolean);
  const friendUids = friends.map(f => f.uid);

  // Filter the incoming users list to only include friends that match the search
  const friendUsers = users.filter(u => friendUids.includes(u.uid));

  if (friendUsers.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-muted-foreground">No contacts found.</p>
            <p className="text-xs text-muted-foreground">
                Use the Explore tab to find new friends.
            </p>
        </div>
    );
  }


  return (
    <ScrollArea className="h-full">
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
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{contact.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
            </div>
            </button>
        ))}
        </div>
    </ScrollArea>
  );
}
