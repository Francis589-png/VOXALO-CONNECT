import ChatLayout from '@/components/chat/chat-layout';
import { FriendsProvider } from '@/components/providers/friends-provider';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <FriendsProvider>
      <ChatLayout currentUser={user} />
    </FriendsProvider>
  );
}
