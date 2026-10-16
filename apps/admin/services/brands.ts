export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  counts?: {
    products: number;
  };
}

export interface BrandQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedBrands {
  items: BrandItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBrandPayload {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateBrandPayload = Partial<CreateBrandPayload>;

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

export const brandsApi = {
  async getBrands(query: BrandQuery = {}): Promise<PaginatedBrands> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.isActive !== undefined) {
      params.set('isActive', String(query.isActive));
    }
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const url = `${API_BASE}/admin/brands?${params.toString()}`;
    const res = await fetchWithAuth(url, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<PaginatedBrands>(res);
  },

  async getBrand(id: string): Promise<BrandItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/brands/${id}`, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<BrandItem>(res);
  },

  async createBrand(payload: CreateBrandPayload): Promise<BrandItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/brands`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<BrandItem>(res);
  },

  async updateBrand(
    id: string,
    payload: UpdateBrandPayload,
  ): Promise<BrandItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return handleResponse<BrandItem>(res);
  },

  async toggleStatus(id: string, isActive: boolean): Promise<BrandItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
    return handleResponse<BrandItem>(res);
  },

  async deleteBrand(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/brands/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async uploadLogo(
    file: File,
  ): Promise<{ logoUrl: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithAuth(`${API_BASE}/admin/brands/upload-logo`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ logoUrl: string; filename: string }>(res);
  },
};

export function resolveLogoUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
