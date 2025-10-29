import ChatLayout from '@/components/chat/chat-layout';
import { FriendsProvider } from '@/components/providers/friends-provider';

export default function Home() {
  return (
    <FriendsProvider>
      <ChatLayout />
    </FriendsProvider>
  );
}
