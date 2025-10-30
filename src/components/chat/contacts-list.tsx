
"use client";

import { useFriends } from '../providers/friends-provider';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { getChatId } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface ContactsListProps {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

function UserPresence({ userId }: { userId: string }) {
  const [presence, setPresence] = useState<{ state: string, last_changed: number } | null>(null);

  useEffect(() => {
    const userStatusRef = ref(rtdb, '/status/' + userId);
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const status = snapshot.val();
      setPresence(status);
    });
    return () => unsubscribe();
  }, [userId]);


  if (!presence) {
    return <p className="text-xs text-muted-foreground truncate">Offline</p>;
  }

  const lastSeenDate = new Date(presence.last_changed);

  if (presence.state === 'online') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        <p className="text-xs text-muted-foreground truncate">Online</p>
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground truncate">
      Active {formatDistanceToNow(lastSeenDate, { addSuffix: true })}
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
                <UserPresence userId={contact.uid} />
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
