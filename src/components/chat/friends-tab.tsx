'use client';
import { useFriends } from '../providers/friends-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Check, UserPlus, X } from 'lucide-react';

interface FriendsTabProps {
  search: string;
}

export default function FriendsTab({ search }: FriendsTabProps) {
  const {
    incomingRequests,
    outgoingRequests,
    friendships,
    users,
    acceptFriendRequest,
    declineFriendRequest,
    sendFriendRequest,
    getFriendshipStatus,
  } = useFriends();

  const searchLower = search.toLowerCase();
  
  const filteredIncoming = incomingRequests.filter(
    (req) => req.sender?.displayName?.toLowerCase().includes(searchLower)
  );

  const filteredOutgoing = outgoingRequests.filter(
    (req) => req.receiver?.displayName?.toLowerCase().includes(searchLower)
  );

  const filteredFriends = friendships.filter(
    (f) => f.friend?.displayName?.toLowerCase().includes(searchLower)
  );

  const allOtherUsers = users.filter(user => {
    const status = getFriendshipStatus(user.uid);
    return status === 'not-friends' && user.displayName?.toLowerCase().includes(searchLower);
  });


  return (
    <div className="flex flex-col gap-4 p-4">
      {filteredIncoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Incoming Requests</h2>
          {filteredIncoming.map((req) => (
            <div key={req.id} className="flex items-center gap-3 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={req.sender?.photoURL!} alt={req.sender?.displayName!} />
                <AvatarFallback>{req.sender?.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{req.sender?.displayName}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => acceptFriendRequest(req.id)}>
                <Check className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => declineFriendRequest(req.id)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {filteredFriends.length > 0 && (
         <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Friends</h2>
            {filteredFriends.map((friendship) => (
                <div key={friendship.id} className="flex items-center gap-3 py-2">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={friendship.friend.photoURL!} alt={friendship.friend.displayName!} />
                        <AvatarFallback>{friendship.friend.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{friendship.friend.displayName}</p>
                    </div>
                </div>
            ))}
         </div>
      )}
      
      {filteredOutgoing.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Pending Requests</h2>
          {filteredOutgoing.map((req) => (
            <div key={req.id} className="flex items-center gap-3 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={req.receiver?.photoURL!} alt={req.receiver?.displayName!} />
                <AvatarFallback>{req.receiver?.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{req.receiver?.displayName}</p>
              </div>
              <Button size="icon" variant="ghost" disabled>
                Pending
              </Button>
            </div>
          ))}
        </div>
      )}

      {allOtherUsers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Add Friends</h2>
          {allOtherUsers.map((user) => (
            <div key={user.uid} className="flex items-center gap-3 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL!} alt={user.displayName!} />
                <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user.displayName}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => sendFriendRequest(user.uid)}>
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
