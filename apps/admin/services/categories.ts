export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  counts?: {
    subcategories: number;
    products: number;
  };
}

export interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedCategories {
  items: CategoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParentOption {
  id: string;
  name: string;
  slug: string;
  depth: number;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function ensureValidToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem('accessToken');
    if (token) return token;

    // Auto-login in dev environment if no token is present
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@az-ecommerce.local',
        password: 'Admin123456!',
      }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
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
    localStorage.removeItem('accessToken');
    const newToken = await ensureValidToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      if (!retryHeaders.has('Content-Type') && !(init.body instanceof FormData)) {
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

export const categoriesApi = {
  async getCategories(query: CategoryQuery = {}): Promise<PaginatedCategories> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.parentId !== undefined && query.parentId !== '') {
      params.set('parentId', query.parentId);
    }
    if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const url = `${API_BASE}/admin/categories?${params.toString()}`;
    const res = await fetchWithAuth(url, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<PaginatedCategories>(res);
  },

  async getParentOptions(excludeId?: string): Promise<ParentOption[]> {
    const params = new URLSearchParams();
    if (excludeId) params.set('excludeId', excludeId);

    const url = `${API_BASE}/admin/categories/parent-options?${params.toString()}`;
    const res = await fetchWithAuth(url, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<ParentOption[]>(res);
  },

  async getCategory(id: string): Promise<CategoryItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/categories/${id}`, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<CategoryItem>(res);
  },

  async createCategory(payload: CreateCategoryPayload): Promise<CategoryItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/categories`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<CategoryItem>(res);
  },

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return handleResponse<CategoryItem>(res);
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async uploadImage(file: File): Promise<{ imageUrl: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithAuth(`${API_BASE}/admin/categories/upload-image`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ imageUrl: string; filename: string }>(res);
  },
};

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
