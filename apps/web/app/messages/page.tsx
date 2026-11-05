'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { StorefrontShell } from '../../components/Shell/StorefrontShell';
import { ConversationList } from '../../components/Messaging/ConversationList';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { messagingClient, type ConversationThread } from '../../lib/messaging-client';

export default function MessagesIndexPage() {
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
  }, [ready]);

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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="h-[calc(100vh-200px)] min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:grid md:grid-cols-[22rem_1fr]">
          <ConversationList conversations={conversations} isLoading={loading} />

          {/* Desktop Right Placeholder */}
          <div className="hidden h-full flex-col items-center justify-center p-8 text-center bg-slate-50 md:flex">
            <div className="rounded-full bg-primary-soft p-4 text-primary">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">Your Messages</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Select a conversation thread from the list to view the message history and chat in real-time.
            </p>
          </div>
        </div>
      </main>
    </StorefrontShell>
  );
}

