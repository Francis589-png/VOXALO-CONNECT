'use client';
import { useFriends } from '../providers/friends-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Check, UserPlus, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface ExplorePageProps {
  search: string;
}

export default function ExplorePage({ search }: ExplorePageProps) {
  const {
    incomingRequests,
    outgoingRequests,
    users,
    acceptFriendRequest,
    declineFriendRequest,
    sendFriendRequest,
    getFriendshipStatus,
  } = useFriends();

  const searchLower = search.toLowerCase();

  const filteredIncoming = incomingRequests.filter(
    (req) =>
      req.sender?.displayName?.toLowerCase().includes(searchLower) ||
      req.sender?.email?.toLowerCase().includes(searchLower)
  );

  const filteredOutgoing = outgoingRequests.filter(
    (req) =>
      req.receiver?.displayName?.toLowerCase().includes(searchLower) ||
      req.receiver?.email?.toLowerCase().includes(searchLower)
  );

  const allOtherUsers = users.filter((user) => {
    const status = getFriendshipStatus(user.uid);
    return (
      status === 'not-friends' &&
      (user.displayName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {filteredIncoming.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              Incoming Requests
            </h2>
            {filteredIncoming.map((req) => (
              <div key={req.id} className="flex items-center gap-3 py-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={req.sender?.photoURL!}
                    alt={req.sender?.displayName!}
                  />
                  <AvatarFallback>
                    {req.sender?.displayName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{req.sender?.displayName}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-green-500 hover:text-green-600"
                  onClick={() => acceptFriendRequest(req.id)}
                >
                  <Check className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => declineFriendRequest(req.id)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {allOtherUsers.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              Discover People
            </h2>
            {allOtherUsers.map((user) => (
              <div key={user.uid} className="flex items-center gap-3 py-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.photoURL!}
                    alt={user.displayName!}
                  />
                  <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{user.displayName}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => sendFriendRequest(user.uid)}
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {filteredOutgoing.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              Pending Requests
            </h2>
            {filteredOutgoing.map((req) => (
              <div key={req.id} className="flex items-center gap-3 py-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={req.receiver?.photoURL!}
                    alt={req.receiver?.displayName!}
                  />
                  <AvatarFallback>
                    {req.receiver?.displayName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{req.receiver?.displayName}</p>
                </div>
                <Button size="sm" variant="ghost" disabled>
                  Pending
                </Button>
              </div>
            ))}
          </div>
        )}

        {filteredIncoming.length === 0 && allOtherUsers.length === 0 && filteredOutgoing.length === 0 && (
            <div className="text-center text-muted-foreground pt-8">
                <p>No new users to show.</p>
                <p className='text-xs'>Try a different search.</p>
            </div>
        )}
      </div>
    </ScrollArea>
  );
}
