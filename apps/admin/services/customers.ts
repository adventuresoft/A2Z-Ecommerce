export type CustomerSpendingTier = 'VIP' | 'REGULAR' | 'ONE_TIME' | 'ZERO_ORDER';

export interface CustomerAddress {
  id: string;
  userId: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
}

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  spendingTier: CustomerSpendingTier;
  primaryCity: string | null;
}

export interface PaginatedCustomers {
  items: CustomerItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  vipCustomers: number;
  regularCustomers: number;
  repeatCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  grandTotal: number;
  itemsCount: number;
  paymentMethod?: string | null;
  createdAt: string;
}

export interface CustomerReviewSummary {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  productTitle: string;
  productSlug: string;
}

export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  tokenVersion: number;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  spendingTier: CustomerSpendingTier;
  cancelledOrdersCount: number;
  addresses: CustomerAddress[];
  recentOrders: CustomerOrderSummary[];
  reviews: CustomerReviewSummary[];
}

export interface QueryCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
  spendingTier?: CustomerSpendingTier | 'ALL' | '';
  city?: string;
  sortBy?: 'createdAt' | 'name' | 'totalSpent' | 'ordersCount' | 'lastOrderDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  isActive?: boolean;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
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

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('az_admin_access_token');
    localStorage.removeItem('accessToken');
    const retryToken = await ensureValidToken();
    if (retryToken) {
      headers.set('Authorization', `Bearer ${retryToken}`);
      return fetch(url, { ...options, headers });
    }
  }

  return res;
}

export const customersService = {
  /**
   * Get high-level customer count metrics, tiers, and revenue totals
   */
  async getCustomerStats(): Promise<CustomerStats> {
    const res = await fetchWithAuth(`${API_BASE}/admin/customers/stats`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch customer statistics');
    }
    return res.json();
  },

  /**
   * Get paginated customer records matching search, tier, status, and sorting
   */
  async getCustomers(params?: QueryCustomersParams): Promise<PaginatedCustomers> {
    const url = new URL(`${API_BASE}/admin/customers`);

    if (params) {
      if (params.page) url.searchParams.set('page', String(params.page));
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.search) url.searchParams.set('search', params.search);
      if (params.isActive !== undefined && params.isActive !== '') {
        url.searchParams.set('isActive', String(params.isActive));
      }
      if (params.spendingTier && params.spendingTier !== 'ALL') {
        url.searchParams.set('spendingTier', params.spendingTier);
      }
      if (params.city) url.searchParams.set('city', params.city);
      if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
    }

    const res = await fetchWithAuth(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch customers');
    }
    return res.json();
  },

  /**
   * Get comprehensive single customer profile with orders history and reviews
   */
  async getCustomerById(id: string): Promise<CustomerDetail> {
    const res = await fetchWithAuth(`${API_BASE}/admin/customers/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch customer #${id}`);
    }
    return res.json();
  },

  /**
   * Register a new customer via admin
   */
  async createCustomer(payload: CreateCustomerPayload): Promise<CustomerDetail> {
    const res = await fetchWithAuth(`${API_BASE}/admin/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create customer');
    }
    return res.json();
  },

  /**
   * Update customer profile, credentials, or addresses
   */
  async updateCustomer(
    id: string,
    payload: UpdateCustomerPayload,
  ): Promise<CustomerDetail> {
    const res = await fetchWithAuth(`${API_BASE}/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update customer');
    }
    return res.json();
  },

  /**
   * Quick toggle of active/inactive account status
   */
  async toggleCustomerStatus(
    id: string,
    isActive: boolean,
    reason?: string,
  ): Promise<{ success: boolean; message: string; customer: CustomerDetail }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/customers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update customer status');
    }
    return res.json();
  },

  /**
   * Delete or archive customer
   */
  async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/customers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete customer');
    }
    return res.json();
  },

  /**
   * Export matching customers to CSV
   */
  async exportCustomersCsv(params?: QueryCustomersParams): Promise<void> {
    const url = new URL(`${API_BASE}/admin/customers/export`);
    if (params) {
      if (params.search) url.searchParams.set('search', params.search);
      if (params.isActive !== undefined && params.isActive !== '') {
        url.searchParams.set('isActive', String(params.isActive));
      }
      if (params.spendingTier && params.spendingTier !== 'ALL') {
        url.searchParams.set('spendingTier', params.spendingTier);
      }
      if (params.city) url.searchParams.set('city', params.city);
      if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
    }

    const res = await fetchWithAuth(url.toString());
    if (!res.ok) {
      throw new Error('Failed to download CSV export');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
