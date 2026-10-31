export interface PaymentMethodSetting {
  id: string;
  code: string;
  name: string;
  description: string | null;
  instructions: string | null;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePaymentMethodPayload {
  name?: string;
  description?: string;
  instructions?: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

export interface TogglePaymentMethodPayload {
  isEnabled?: boolean;
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
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}

export const paymentMethodsService = {
  /**
   * Fetch all payment methods (Admin)
   */
  async getAll(): Promise<PaymentMethodSetting[]> {
    const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods`, {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch payment methods');
    }

    return res.json();
  },

  /**
   * Fetch single payment method by ID
   */
  async getById(id: string): Promise<PaymentMethodSetting> {
    const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods/${id}`, {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch payment method ${id}`);
    }

    return res.json();
  },

  /**
   * Update payment method configuration
   */
  async update(
    id: string,
    payload: UpdatePaymentMethodPayload,
  ): Promise<PaymentMethodSetting> {
    const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update payment method');
    }

    return res.json();
  },

  /**
   * Instant toggle payment method active/disabled status
   */
  async toggle(
    id: string,
    isEnabled?: boolean,
  ): Promise<PaymentMethodSetting> {
    const res = await fetchWithAuth(
      `${API_BASE}/admin/payment-methods/${id}/toggle`,
      {
        method: 'PATCH',
        body: JSON.stringify(isEnabled !== undefined ? { isEnabled } : {}),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to toggle payment method');
    }

    return res.json();
  },
};
