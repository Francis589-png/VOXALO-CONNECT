
'use client';

import ChatLayout from '@/components/chat/chat-layout';
import { FriendsProvider } from '@/components/providers/friends-provider';
import { useAuth } from '@/hooks/use-auth';
import { GroupInfoProvider } from '@/components/providers/group-info-provider';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function HomePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');

  if (!user) return null;

  return (
    <GroupInfoProvider>
        <FriendsProvider>
            <ChatLayout currentUser={user} initialChatId={chatId} />
        </FriendsProvider>
    </GroupInfoProvider>
  );
}


export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
