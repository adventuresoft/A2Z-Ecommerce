export type PaymentMethod =
  | 'CASH_ON_DELIVERY'
  | 'CREDIT_CARD'
  | 'MOBILE_BANKING';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type RefundStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export interface AdminPaymentRefundSummary {
  id: string;
  amount: number;
  status: RefundStatus;
  reason: string;
  createdAt: string;
}

export interface AdminOrderSummaryInPayment {
  id: string;
  orderNumber: string;
  grandTotal: number;
  orderStatus: string;
  paymentStatus: PaymentStatus;
  recipientName: string;
  recipientPhone: string;
  customerName?: string;
  customerEmail?: string;
}

export interface AdminPayment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionRef: string | null;
  idempotencyKey: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  refundedAmount?: number;
  refunds?: AdminPaymentRefundSummary[];
  order?: AdminOrderSummaryInPayment;
}

export interface AdminRefund {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  refundMethod: PaymentMethod | null;
  transactionRef: string | null;
  notes: string | null;
  processedByUserId: string | null;
  processedByUserName: string | null;
  createdAt: string;
  updatedAt: string;
  order?: AdminOrderSummaryInPayment;
  payment?: {
    id: string;
    method: PaymentMethod;
    amount: number;
    status: PaymentStatus;
    transactionRef: string | null;
  };
}

export interface PaginatedPayments {
  items: AdminPayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedRefunds {
  items: AdminRefund[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentStats {
  totalVolume: number;
  totalCollected: number;
  totalPendingCod: number;
  totalRefunded: number;
  transactionCount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundCount: number;
  pendingRefundCount: number;
}

export interface QueryPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface QueryRefundsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RefundStatus;
  orderId?: string;
  paymentId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface RecordPaymentPayload {
  orderId: string;
  method?: PaymentMethod;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  transactionRef?: string;
  idempotencyKey?: string;
  notes?: string;
  paidAt?: string;
}

export interface UpdatePaymentStatusPayload {
  status: PaymentStatus;
  transactionRef?: string;
  notes?: string;
  paidAt?: string;
}

export interface CreateRefundPayload {
  orderId: string;
  paymentId?: string;
  amount: number;
  reason: string;
  status?: RefundStatus;
  refundMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}

export interface UpdateRefundStatusPayload {
  status: RefundStatus;
  transactionRef?: string;
  notes?: string;
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
    // Fail silently
  }
  return null;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await ensureValidToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export const paymentsService = {
  /**
   * Fetch paginated payment transactions
   */
  async getTransactions(
    params?: QueryPaymentsParams,
  ): Promise<PaginatedPayments> {
    const url = new URL(`${API_BASE}/admin/payments/transactions`);
    if (params) {
      if (params.page) url.searchParams.set('page', String(params.page));
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.search) url.searchParams.set('search', params.search);
      if (params.status) url.searchParams.set('status', params.status);
      if (params.method) url.searchParams.set('method', params.method);
      if (params.orderId) url.searchParams.set('orderId', params.orderId);
      if (params.dateFrom) url.searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) url.searchParams.set('dateTo', params.dateTo);
      if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder)
        url.searchParams.set('sortOrder', params.sortOrder);
    }

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch transactions');
    }

    const json = await res.json();
    return {
      items: json.data || [],
      total: json.meta?.total || 0,
      page: json.meta?.page || 1,
      limit: json.meta?.limit || 10,
      totalPages: json.meta?.totalPages || 1,
    };
  },

  /**
   * Fetch transaction details by ID
   */
  async getTransactionById(id: string): Promise<AdminPayment> {
    const res = await fetchWithAuth(
      `${API_BASE}/admin/payments/transactions/${id}`,
      {
        method: 'GET',
      },
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to fetch transaction with ID ${id}`,
      );
    }
    return res.json();
  },

  /**
   * Manually record a new payment transaction
   */
  async recordPayment(payload: RecordPaymentPayload): Promise<AdminPayment> {
    const res = await fetchWithAuth(
      `${API_BASE}/admin/payments/transactions`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to record payment');
    }
    return res.json();
  },

  /**
   * Update payment status (e.g. mark as PAID or FAILED)
   */
  async updatePaymentStatus(
    id: string,
    payload: UpdatePaymentStatusPayload,
  ): Promise<AdminPayment> {
    const res = await fetchWithAuth(
      `${API_BASE}/admin/payments/transactions/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update payment status');
    }
    return res.json();
  },

  /**
   * Fetch payment and refund summary statistics
   */
  async getPaymentStats(): Promise<PaymentStats> {
    const res = await fetchWithAuth(`${API_BASE}/admin/payments/stats`, {
      method: 'GET',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load payment statistics');
    }
    return res.json();
  },

  /**
   * Fetch paginated refund records
   */
  async getRefunds(params?: QueryRefundsParams): Promise<PaginatedRefunds> {
    const url = new URL(`${API_BASE}/admin/refunds`);
    if (params) {
      if (params.page) url.searchParams.set('page', String(params.page));
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.search) url.searchParams.set('search', params.search);
      if (params.status) url.searchParams.set('status', params.status);
      if (params.orderId) url.searchParams.set('orderId', params.orderId);
      if (params.paymentId)
        url.searchParams.set('paymentId', params.paymentId);
      if (params.dateFrom) url.searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) url.searchParams.set('dateTo', params.dateTo);
      if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder)
        url.searchParams.set('sortOrder', params.sortOrder);
    }

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch refunds');
    }

    const json = await res.json();
    return {
      items: json.data || [],
      total: json.meta?.total || 0,
      page: json.meta?.page || 1,
      limit: json.meta?.limit || 10,
      totalPages: json.meta?.totalPages || 1,
    };
  },

  /**
   * Fetch single refund details by ID
   */
  async getRefundById(id: string): Promise<AdminRefund> {
    const res = await fetchWithAuth(`${API_BASE}/admin/refunds/${id}`, {
      method: 'GET',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to fetch refund with ID ${id}`,
      );
    }
    return res.json();
  },

  /**
   * Issue a new refund
   */
  async createRefund(payload: CreateRefundPayload): Promise<AdminRefund> {
    const res = await fetchWithAuth(`${API_BASE}/admin/refunds`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to issue refund');
    }
    return res.json();
  },

  /**
   * Update refund resolution status (e.g. approve or reject pending refund)
   */
  async updateRefundStatus(
    id: string,
    payload: UpdateRefundStatusPayload,
  ): Promise<AdminRefund> {
    const res = await fetchWithAuth(`${API_BASE}/admin/refunds/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update refund status');
    }
    return res.json();
  },
};
