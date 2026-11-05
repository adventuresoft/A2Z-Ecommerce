import { request } from './api-client';

export type MessageFlagType = 'PHONE' | 'LINK';

export interface MessageSender {
  id: string;
  name: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  flags: MessageFlagType[];
  createdAt: string;
  readAt?: string | null;
  sender: MessageSender;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  photoUrl?: string | null;
  role: 'CLIENT' | 'FREELANCER';
  title?: string | null;
}

export interface ConversationThread {
  id: string;
  isClient: boolean;
  unreadCount: number;
  lastMessageAt: string;
  lastMessage?: {
    id: string;
    body: string;
    flags: MessageFlagType[];
    senderId: string;
    createdAt: string;
    readAt?: string | null;
  } | null;
  otherParticipant: ConversationParticipant;
}

export interface MessageHistoryResponse {
  conversation: {
    id: string;
    clientId: string;
    freelancerUserId: string;
    freelancerDisplayName: string;
    clientName: string;
    isClient: boolean;
  };
  items: MessageItem[];
  hasMore: boolean;
}

export const messagingClient = {
  createConversation(freelancerId: string, initialMessage?: string) {
    return request<ConversationThread>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ freelancerId, initialMessage }),
    });
  },

  listConversations() {
    return request<ConversationThread[]>('/conversations');
  },

  getMessages(conversationId: string, beforeId?: string) {
    const qs = beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : '';
    return request<MessageHistoryResponse>(`/conversations/${encodeURIComponent(conversationId)}/messages${qs}`);
  },

  sendMessage(conversationId: string, body: string) {
    return request<MessageItem>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  markAsRead(conversationId: string) {
    return request<{ success: boolean }>(`/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: 'POST',
    });
  },

  reportConversation(conversationId: string, reason: string, messageId?: string) {
    return request<{ id: string }>(`/conversations/${encodeURIComponent(conversationId)}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, messageId }),
    });
  },

  blockUser(targetUserId: string) {
    return request<{ blockerId: string; blockedId: string }>(`/users/${encodeURIComponent(targetUserId)}/block`, {
      method: 'POST',
    });
  },

  unblockUser(targetUserId: string) {
    return request<{ count: number }>(`/users/${encodeURIComponent(targetUserId)}/block`, {
      method: 'DELETE',
    });
  },
};

