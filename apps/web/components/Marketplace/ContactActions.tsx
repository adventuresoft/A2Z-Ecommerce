'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, MessageSquare, Phone, PhoneCall } from 'lucide-react';
import { marketplaceClient } from '../../lib/marketplace-client';
import { messagingClient } from '../../lib/messaging-client';

interface ContactActionsProps {
  freelancerId: string;
  isMember: boolean;
  isLoading?: boolean;
  /** Stack full-width buttons (profile) instead of an inline row (card). */
  layout?: 'inline' | 'stacked';
}

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed';
const unlocked = `${base} border border-slate-300 bg-white text-slate-900 hover:bg-slate-50`;
const locked = `${base} border border-accent/40 bg-accent-soft text-accent-hover hover:border-accent`;

export function ContactActions({
  freelancerId,
  isMember,
  isLoading = false,
  layout = 'inline',
}: ContactActionsProps) {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [messagingBusy, setMessagingBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; buyPlan?: boolean } | null>(null);

  const wrap = layout === 'stacked' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2';

  const reveal = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await marketplaceClient.revealPhone(freelancerId);
      setPhone(res.phone);
    } catch (err: any) {
      if (err?.status === 403) {
        setNotice({ text: 'Buy a plan to see phone numbers.', buyPlan: true });
      } else if (err?.status === 429) {
        const resets = err?.data?.resetsAt
          ? new Date(err.data.resetsAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
          : 'midnight';
        setNotice({ text: `Daily limit reached. It resets at ${resets}.` });
      } else if (err?.status === 404) {
        setNotice({ text: 'This professional is no longer listed.' });
      } else {
        setNotice({ text: err?.message || 'Could not show the number. Try again.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const startChat = async () => {
    setMessagingBusy(true);
    setNotice(null);
    try {
      const conv = await messagingClient.createConversation(freelancerId);
      router.push(`/messages/${conv.id}`);
    } catch (err: any) {
      if (err?.status === 403) {
        setNotice({ text: 'Active membership plan required to send messages.', buyPlan: true });
      } else if (err?.status === 429) {
        setNotice({ text: 'Daily limit of 20 new conversations reached.' });
      } else {
        setNotice({ text: err?.message || 'Failed to start conversation.' });
      }
    } finally {
      setMessagingBusy(false);
    }
  };

  if (isLoading) {
    return <div className="h-11 w-48 animate-pulse rounded-md bg-slate-200 motion-reduce:animate-none" aria-hidden="true" />;
  }

  return (
    <div className="space-y-2">
      <div className={wrap}>
        {isMember ? (
          phone ? (
            <a href={`tel:${phone}`} className={`${unlocked} border-green-700/40 text-green-800`}>
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums">{phone}</span>
            </a>
          ) : (
            <button type="button" onClick={reveal} disabled={busy} className={unlocked}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              {busy ? 'Showing…' : 'Show number'}
            </button>
          )
        ) : (
          <Link href="/membership" className={locked}>
            <Lock className="h-4 w-4" aria-hidden="true" />
            Show number
            <span className="sr-only">(membership required)</span>
          </Link>
        )}

        {isMember ? (
          <button
            type="button"
            onClick={startChat}
            disabled={messagingBusy}
            className={unlocked}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {messagingBusy ? 'Opening...' : 'Send message'}
          </button>
        ) : (
          <Link href="/membership" className={locked}>
            <Lock className="h-4 w-4" aria-hidden="true" />
            Send message
            <span className="sr-only">(membership required)</span>
          </Link>
        )}
      </div>

      {notice && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {notice.text}{' '}
          {notice.buyPlan && (
            <Link href="/membership" className="underline underline-offset-2">
              See plans
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

