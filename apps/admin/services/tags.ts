export interface TagItem {
  id: string;
  name: string;
  slug: string;
  colorCode?: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'productCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTags {
  items: TagItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTagPayload {
  name: string;
  slug?: string;
  colorCode?: string;
  isActive?: boolean;
}

export type UpdateTagPayload = Partial<CreateTagPayload>;

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

export const tagsApi = {
  async getTags(query: TagQuery = {}): Promise<PaginatedTags> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.isActive !== undefined) {
      params.set('isActive', String(query.isActive));
    }
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const res = await fetchWithAuth(
      `${API_BASE}/admin/tags?${params.toString()}`,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch tags');
    }
    return res.json();
  },

  async getTag(idOrSlug: string): Promise<TagItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/tags/${idOrSlug}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch tag');
    }
    return res.json();
  },

  async createTag(payload: CreateTagPayload): Promise<TagItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/tags`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create tag');
    }
    return res.json();
  },

  async updateTag(id: string, payload: UpdateTagPayload): Promise<TagItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update tag');
    }
    return res.json();
  },

  async deleteTag(id: string): Promise<{ message: string; id: string }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/tags/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete tag');
    }
    return res.json();
  },
};
