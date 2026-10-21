export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type NotificationType =
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'LOW_STOCK'
  | 'PROMOTION'
  | 'SYSTEM';

export interface AdminReviewProductSummary {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string | null;
}

export interface AdminReviewUserSummary {
  id: string;
  name: string;
  email: string;
}

export interface AdminReviewOrderSummary {
  id: string;
  orderNumber: string;
}

export interface AdminReview {
  id: string;
  productId: string;
  userId: string;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  product?: AdminReviewProductSummary;
  user?: AdminReviewUserSummary;
  order?: AdminReviewOrderSummary | null;
}

export interface PaginatedReviews {
  items: AdminReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewStats {
  totalReviews: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageRating: number;
  verifiedPurchaseCount: number;
  ratingDistribution: {
    star1: number;
    star2: number;
    star3: number;
    star4: number;
    star5: number;
  };
}

export interface QueryReviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus;
  rating?: number;
  productId?: string;
  isVerifiedPurchase?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminNotificationUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  user?: AdminNotificationUserSummary;
}

export interface PaginatedNotifications {
  items: AdminNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  totalCount: number;
  unreadCount: number;
  readCount: number;
  byType: {
    orderStatus: number;
    payment: number;
    lowStock: number;
    promotion: number;
    system: number;
  };
}

export interface QueryNotificationsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: NotificationType;
  isRead?: boolean;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
}

export interface BroadcastNotificationPayload {
  targetRole?: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function ensureValidToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const token =
      localStorage.getItem('az_admin_access_token') ||
      localStorage.getItem('accessToken');
    if (token) return token;

    // Auto-login fallback for dev environment
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@az-ecommerce.local',
        password: 'Password123!',
      }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data.accessToken) {
        localStorage.setItem('az_admin_access_token', data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('az_admin_refresh_token', data.refreshToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('az_admin_user', JSON.stringify(data.user));
        }
        return data.accessToken;
      }
    }
  } catch {
    // Ignore error
  }
  return null;
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await ensureValidToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      errMessage = errData.message || errData.error || errMessage;
    } catch {
      // Keep default message
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<T>;
}

export const engagementService = {
  // --- Reviews ---
  async getReviewStats(): Promise<ReviewStats> {
    return apiFetch<ReviewStats>('/admin/reviews/stats');
  },

  async getReviews(params: QueryReviewsParams = {}): Promise<PaginatedReviews> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.rating) searchParams.set('rating', params.rating.toString());
    if (params.productId) searchParams.set('productId', params.productId);
    if (params.isVerifiedPurchase !== undefined)
      searchParams.set('isVerifiedPurchase', String(params.isVerifiedPurchase));
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const qs = searchParams.toString();
    return apiFetch<PaginatedReviews>(`/admin/reviews${qs ? `?${qs}` : ''}`);
  },

  async getReviewById(id: string): Promise<AdminReview> {
    return apiFetch<AdminReview>(`/admin/reviews/${id}`);
  },

  async updateReviewStatus(
    id: string,
    status: ReviewStatus,
    adminNotes?: string,
  ): Promise<AdminReview> {
    return apiFetch<AdminReview>(`/admin/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(
      `/admin/reviews/${id}`,
      {
        method: 'DELETE',
      },
    );
  },

  // --- Notifications ---
  async getNotificationStats(): Promise<NotificationStats> {
    return apiFetch<NotificationStats>('/admin/notifications/stats');
  },

  async getNotifications(
    params: QueryNotificationsParams = {},
  ): Promise<PaginatedNotifications> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.type) searchParams.set('type', params.type);
    if (params.isRead !== undefined)
      searchParams.set('isRead', String(params.isRead));
    if (params.userId) searchParams.set('userId', params.userId);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const qs = searchParams.toString();
    return apiFetch<PaginatedNotifications>(
      `/admin/notifications${qs ? `?${qs}` : ''}`,
    );
  },

  async createNotification(
    payload: CreateNotificationPayload,
  ): Promise<AdminNotification> {
    return apiFetch<AdminNotification>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async broadcastNotification(
    payload: BroadcastNotificationPayload,
  ): Promise<{ success: boolean; dispatchedCount: number }> {
    return apiFetch<{ success: boolean; dispatchedCount: number }>(
      '/admin/notifications/broadcast',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  async markNotificationAsRead(id: string): Promise<AdminNotification> {
    return apiFetch<AdminNotification>(`/admin/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
    return apiFetch<{ success: boolean; count: number }>(
      '/admin/notifications/mark-all-read',
      {
        method: 'PATCH',
      },
    );
  },

  async deleteNotification(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(
      `/admin/notifications/${id}`,
      {
        method: 'DELETE',
      },
    );
  },

  // Navbar user notifications
  async getMyNotifications(
    unreadOnly = false,
    limit = 5,
  ): Promise<PaginatedNotifications> {
    return apiFetch<PaginatedNotifications>(
      `/notifications/my?unreadOnly=${unreadOnly}&limit=${limit}`,
    );
  },

  async getMyUnreadCount(): Promise<{ unreadCount: number }> {
    return apiFetch<{ unreadCount: number }>('/notifications/unread-count');
  },
};
