
"use client";

import { useFriends } from '../providers/friends-provider';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { getChatId } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ContactsListProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

function UserLastSeen({ userId }: { userId: string }) {
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      const userData = snapshot.data() as User;
      if (userData?.lastSeen) {
        setLastSeen(userData.lastSeen.toDate());
      }
    });
    return () => unsubscribe();
  }, [userId]);

  if (!lastSeen) {
    return <p className="text-xs text-muted-foreground truncate">Offline</p>;
  }

  return (
    <p className="text-xs text-muted-foreground truncate">
      Active {formatDistanceToNow(lastSeen, { addSuffix: true })}
    </p>
  );
}


function ContactItem({ contact, isSelected, onSelectUser }: { contact: User, isSelected: boolean, onSelectUser: (user: User) => void }) {
    const { user: currentUser } = useAuth();
    const chatId = currentUser ? getChatId(currentUser.uid, contact.uid) : null;
    const unreadCount = useUnreadCount(chatId, currentUser?.uid);

    return (
        <button
            onClick={() => onSelectUser(contact)}
            className={`flex items-center gap-3 p-4 text-left hover:bg-muted/50 w-full ${
                isSelected ? 'bg-muted' : ''
            }`}
            >
            <Avatar className="h-10 w-10">
              <AvatarImage src={contact.photoURL!} alt={contact.displayName!} />
              <AvatarFallback>{contact.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <div className='flex items-center justify-between'>
                    <p className="font-semibold truncate">{contact.displayName}</p>
                    {unreadCount > 0 && (
                        <Badge variant="default" className="h-5 px-2 text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
                <UserLastSeen userId={contact.uid} />
            </div>
        </button>
    );
}


export default function ContactsList({
  users,
  selectedUser,
  onSelectUser,
}: ContactsListProps) {
  const { friendships } = useFriends();

  const friends = friendships.map(f => f.friend).filter(Boolean);
  const friendUids = friends.map(f => f.uid);

  // Create a map for quick lookup of friend details
  const friendMap = new Map<string, User>();
  users.forEach(user => {
    if (friendUids.includes(user.uid)) {
        friendMap.set(user.uid, user);
    }
  });

  // Get the complete friend objects from the map
  const friendUsers = Array.from(friendMap.values());
  const allContacts = friendUsers;


  if (allContacts.length === 0) {
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
        {allContacts.map((contact) => (
            <ContactItem 
                key={contact.uid} 
                contact={contact}
                isSelected={selectedUser?.uid === contact.uid}
                onSelectUser={onSelectUser}
            />
        ))}
        </div>
    </ScrollArea>
  );
}
