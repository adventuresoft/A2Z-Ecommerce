'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { ConversationThread } from '../../lib/messaging-client';
import { Avatar } from '../Marketplace/FreelancerCard';

interface ConversationListProps {
  conversations: ConversationThread[];
  activeId?: string;
  isLoading?: boolean;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function ConversationList({
  conversations,
  activeId,
  isLoading = false,
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.otherParticipant.name.toLowerCase().includes(q) ||
      (c.otherParticipant.title && c.otherParticipant.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Header & Search */}
      <div className="border-b border-slate-200 p-4">
        <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {search ? 'No conversations match your search.' : 'No conversations yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((conv) => {
              const isActive = conv.id === activeId;
              const hasUnread = conv.unreadCount > 0;

              return (
                <li key={conv.id}>
                  <Link
                    href={`/messages/${conv.id}`}
                    className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 ${
                      isActive ? 'bg-primary-soft/60 hover:bg-primary-soft' : ''
                    }`}
                  >
                    <Avatar
                      name={conv.otherParticipant.name}
                      photoUrl={conv.otherParticipant.photoUrl || null}
                      size={48}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className={`truncate text-sm font-semibold ${hasUnread ? 'text-slate-950 font-bold' : 'text-slate-900'}`}>
                          {conv.otherParticipant.name}
                        </h2>
                        <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      {conv.otherParticipant.title && (
                        <p className="truncate text-xs text-primary font-medium">
                          {conv.otherParticipant.title}
                        </p>
                      )}

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className={`truncate text-xs ${hasUnread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                          {conv.lastMessage ? conv.lastMessage.body : 'Conversation started'}
                        </p>

                        {hasUnread && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

