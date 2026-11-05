'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  ShieldAlert,
  AlertCircle,
  Flag,
  UserX,
  UserCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  messagingClient,
  type MessageHistoryResponse,
  type MessageItem,
} from '../../lib/messaging-client';
import { getMessagingSocket } from '../../lib/socket-client';
import { Avatar } from '../Marketplace/FreelancerCard';
import { ReportModal } from './ReportModal';

interface ChatRoomProps {
  conversationId: string;
  onBackMobile?: () => void;
}

export function ChatRoom({ conversationId, onBackMobile }: ChatRoomProps) {
  const { user } = useAuth();
  const [data, setData] = useState<MessageHistoryResponse | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<{ text: string; link?: string } | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockingBusy, setBlockingBusy] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const res = await messagingClient.getMessages(conversationId);
      setData(res);
      setMessages(res.items);
      await messagingClient.markAsRead(conversationId);
    } catch (err: any) {
      setErrorNotice({ text: err?.message || 'Failed to load conversation history.' });
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.IO real-time listener
  useEffect(() => {
    const socket = getMessagingSocket();
    if (!socket) return;

    const handleNewMessage = (payload: { conversationId: string; message: MessageItem }) => {
      if (payload.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        void messagingClient.markAsRead(conversationId);
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setErrorNotice(null);
    try {
      const sent = await messagingClient.sendMessage(conversationId, text);
      setMessages((prev) => [...prev, sent]);
      setInputText('');
    } catch (err: any) {
      if (err?.data?.code === 'PROHIBITED_CONTENT') {
        setErrorNotice({ text: 'Message blocked: contains prohibited or abusive words.' });
      } else if (err?.data?.code === 'MEMBERSHIP_EXPIRED' || err?.status === 403) {
        setErrorNotice({
          text: 'Membership plan required to send messages.',
          link: '/membership',
        });
      } else if (err?.data?.code === 'FLAG_COOLDOWN_ACTIVE' || err?.status === 429) {
        setErrorNotice({ text: err?.data?.message || 'Temporarily rate limited. Please try again later.' });
      } else {
        setErrorNotice({ text: err?.message || 'Failed to send message.' });
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e);
    }
  };

  const otherName = data?.conversation
    ? data.conversation.isClient
      ? data.conversation.freelancerDisplayName
      : data.conversation.clientName
    : 'Conversation';

  const otherUserId = data?.conversation
    ? data.conversation.isClient
      ? data.conversation.freelancerUserId
      : data.conversation.clientId
    : null;

  const handleToggleBlock = async () => {
    if (!otherUserId || blockingBusy) return;
    setBlockingBusy(true);
    try {
      if (isBlocked) {
        await messagingClient.unblockUser(otherUserId);
        setIsBlocked(false);
      } else {
        await messagingClient.blockUser(otherUserId);
        setIsBlocked(true);
      }
    } catch (err: any) {
      alert(err?.message || 'Block action failed');
    } finally {
      setBlockingBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="mr-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Back to conversations list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <Avatar name={otherName} photoUrl={null} size={40} />

          <div>
            <h2 className="text-sm font-bold text-slate-900">{otherName}</h2>
            <p className="text-xs text-slate-500">
              {data?.conversation?.isClient ? 'Professional' : 'Client'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-primary"
            title="Report conversation"
          >
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Report</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBlock}
            disabled={blockingBusy}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-primary ${
              isBlocked
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isBlocked ? 'Unblock user' : 'Block user'}
          >
            {isBlocked ? (
              <>
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Unblock</span>
              </>
            ) : (
              <>
                <UserX className="h-4 w-4" />
                <span className="hidden sm:inline">Block</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <span>
          <strong>Safety Notice:</strong> Keep conversations on-platform. Abusive terms and suspicious links are blocked and monitored.
        </span>
      </div>

      {reportSuccess && (
        <div className="flex items-center justify-between bg-green-50 px-4 py-2 text-xs text-green-800">
          <span>Report submitted successfully. Our safety moderation team will review this thread.</span>
          <button type="button" onClick={() => setReportSuccess(false)} className="font-bold">✕</button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <ShieldAlert className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs">Say hello to get started with your service request.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const hasPhone = msg.flags?.includes('PHONE');
            const hasLink = msg.flags?.includes('LINK');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                    isMe
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>

                  {(hasPhone || hasLink) && (
                    <div
                      className={`mt-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        isMe ? 'bg-primary-hover/50 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>Contact detail / external link flagged for safety</span>
                    </div>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-slate-400">
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && msg.readAt && (
                    <span className="flex items-center gap-0.5 text-blue-600 font-medium">
                      <Check className="h-3 w-3" />
                      <span>Read</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error / Alert notice */}
      {errorNotice && (
        <div className="border-t border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorNotice.text}</span>
            </div>
            {errorNotice.link && (
              <Link href={errorNotice.link} className="font-bold underline underline-offset-2">
                Renew Plan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Message Input Bar */}
      <div className="border-t border-slate-200 bg-white p-3">
        {isBlocked ? (
          <div className="rounded-lg bg-slate-100 p-3 text-center text-xs text-slate-600">
            You have blocked communication with this user. Unblock above to send messages.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={2000}
                placeholder="Type your message... (Press Enter to send)"
                className="max-h-32 min-h-11 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-primary"
                disabled={sending}
              />
              <span className="absolute bottom-1 right-2 text-[10px] text-slate-400">
                {inputText.length}/2000
              </span>
            </div>

            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      <ReportModal
        conversationId={conversationId}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSuccess={() => setReportSuccess(true)}
      />
    </div>
  );
}

