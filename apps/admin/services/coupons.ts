export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type CouponComputedStatus =
  | 'LIVE'
  | 'SCHEDULED'
  | 'EXPIRED'
  | 'EXHAUSTED'
  | 'INACTIVE';

export interface CouponUsageItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderGrandTotal: number;
  userId: string;
  customerName: string;
  customerEmail: string;
  discountApplied: number;
  usedAt: string;
}

export interface CouponItem {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  totalUsageLimit?: number | null;
  perCustomerLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usagesCount: number;
  totalDiscountGiven: number;
  computedStatus: CouponComputedStatus;
  usages?: CouponUsageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CouponStats {
  totalCoupons: number;
  liveCoupons: number;
  scheduledCoupons: number;
  expiredOrExhaustedCoupons: number;
  totalRedemptions: number;
  totalDiscountGranted: number;
}

export interface CouponQuery {
  page?: number;
  limit?: number;
  search?: string;
  discountType?: DiscountType | '';
  isActive?: boolean;
  status?: CouponComputedStatus | '';
}

export interface PaginatedCoupons {
  items: CouponItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCouponPayload {
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  totalUsageLimit?: number | null;
  perCustomerLimit?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function ensureValidToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const token =
      localStorage.getItem('az_admin_access_token') ||
      localStorage.getItem('accessToken');
    if (token) return token;

    // Auto-login in dev environment if no token is present
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
    // ignore
  }

  return null;
}

async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<Response> {
  const token = await ensureValidToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(
      `Cannot connect to API server at ${API_BASE}. Please ensure the NestJS backend is running (pnpm --filter api run dev).`,
    );
  }

  if (res.status === 401 && !isRetry && typeof window !== 'undefined') {
    localStorage.removeItem('az_admin_access_token');
    localStorage.removeItem('accessToken');
    const newToken = await ensureValidToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      if (
        !retryHeaders.has('Content-Type') &&
        !(init.body instanceof FormData)
      ) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...init, headers: retryHeaders });
    }
  }

  return res;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (Array.isArray(data.message)) {
        errorMessage = data.message.join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    } catch {
      // use default error message
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

export const couponsApi = {
  async getStats(): Promise<CouponStats> {
    const res = await fetchWithAuth(`${API_BASE}/admin/coupons/stats`, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<CouponStats>(res);
  },

  async getCoupons(query: CouponQuery = {}): Promise<PaginatedCoupons> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.discountType) params.set('discountType', query.discountType);
    if (query.status) params.set('status', query.status);
    if (query.isActive !== undefined) {
      params.set('isActive', String(query.isActive));
    }

    const url = `${API_BASE}/admin/coupons?${params.toString()}`;
    const res = await fetchWithAuth(url, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<PaginatedCoupons>(res);
  },

  async getCouponById(id: string): Promise<CouponItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/coupons/${id}`, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<CouponItem>(res);
  },

  async createCoupon(payload: CreateCouponPayload): Promise<CouponItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/coupons`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<CouponItem>(res);
  },

  async updateCoupon(
    id: string,
    payload: UpdateCouponPayload,
  ): Promise<CouponItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return handleResponse<CouponItem>(res);
  },

  async toggleStatus(id: string, isActive: boolean): Promise<CouponItem> {
    return this.updateCoupon(id, { isActive });
  },

  async deleteCoupon(
    id: string,
  ): Promise<{ success: boolean; deactivated: boolean; message: string }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/coupons/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{
      success: boolean;
      deactivated: boolean;
      message: string;
    }>(res);
  },
};
