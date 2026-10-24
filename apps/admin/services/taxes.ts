export interface TaxClassItem {
  id: string;
  name: string;
  code: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string | null;
  categoriesCount: number;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaxClassQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedTaxClasses {
  items: TaxClassItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTaxClassPayload {
  name: string;
  code: string;
  rate: number;
  isDefault?: boolean;
  isActive?: boolean;
  description?: string;
}

export type UpdateTaxClassPayload = Partial<CreateTaxClassPayload>;

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

export const taxesApi = {
  async getTaxes(query: TaxClassQuery = {}): Promise<PaginatedTaxClasses> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.isActive !== undefined) {
      params.set('isActive', String(query.isActive));
    }

    const url = `${API_BASE}/admin/taxes?${params.toString()}`;
    const res = await fetchWithAuth(url, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<PaginatedTaxClasses>(res);
  },

  async getTaxById(id: string): Promise<TaxClassItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/taxes/${id}`, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<TaxClassItem>(res);
  },

  async createTax(payload: CreateTaxClassPayload): Promise<TaxClassItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/taxes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<TaxClassItem>(res);
  },

  async updateTax(
    id: string,
    payload: UpdateTaxClassPayload,
  ): Promise<TaxClassItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/taxes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return handleResponse<TaxClassItem>(res);
  },

  async toggleStatus(id: string, isActive: boolean): Promise<TaxClassItem> {
    return this.updateTax(id, { isActive });
  },

  async setDefault(id: string): Promise<TaxClassItem> {
    return this.updateTax(id, { isDefault: true, isActive: true });
  },

  async deleteTax(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/taxes/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
