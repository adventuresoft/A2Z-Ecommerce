'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontShell } from '../../../components/Shell/StorefrontShell';
import { ConversationList } from '../../../components/Messaging/ConversationList';
import { ChatRoom } from '../../../components/Messaging/ChatRoom';
import { useRequireAuth } from '../../../lib/useRequireAuth';
import { messagingClient, type ConversationThread } from '../../../lib/messaging-client';

export default function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    messagingClient
      .listConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [ready, id]);

  if (!ready) {
    return (
      <StorefrontShell>
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell>
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="h-[calc(100vh-180px)] min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:grid md:grid-cols-[22rem_1fr]">
          {/* Left panel: hidden on small screens when thread is active */}
          <div className="hidden h-full md:block">
            <ConversationList
              conversations={conversations}
              activeId={id}
              isLoading={loading}
            />
          </div>

          {/* Right panel: full width on mobile, right column on desktop */}
          <div className="h-full">
            <ChatRoom
              conversationId={id}
              onBackMobile={() => router.push('/messages')}
            />
          </div>
        </div>
      </main>
    </StorefrontShell>
  );
}

