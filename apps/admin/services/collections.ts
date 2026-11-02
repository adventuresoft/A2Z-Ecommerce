export type CollectionDesignTemplate = 'default' | 'collection-1' | 'collection-2';

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bannerUrl?: string | null;
  badgeText?: string | null;
  isActive: boolean;
  showOnHomePage?: boolean;
  designTemplate?: CollectionDesignTemplate;
  startDate?: string | null;
  endDate?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    categories: number;
    tags: number;
    products: number;
  };
  categories?: { category: { id: string; name: string; slug: string } }[];
  tags?: { tag: { id: string; name: string; slug: string } }[];
  products?: { product: { id: string; title: string; slug: string; thumbnailUrl?: string | null } }[];
  categoryIds?: string[];
  tagIds?: string[];
  productIds?: string[];
}

export interface CollectionQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  showOnHomePage?: boolean;
  designTemplate?: CollectionDesignTemplate;
}

export interface PaginatedCollections {
  data: CollectionItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CollectionPayload {
  name: string;
  slug?: string;
  description?: string;
  bannerUrl?: string;
  badgeText?: string;
  isActive?: boolean;
  showOnHomePage?: boolean;
  designTemplate?: CollectionDesignTemplate;
  startDate?: string | null;
  endDate?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
  categoryIds?: string[];
  tagIds?: string[];
  productIds?: string[];
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
      const newToken = data.accessToken || data.token;
      if (newToken) {
        localStorage.setItem('az_admin_access_token', newToken);
        return newToken;
      }
    }
  } catch (err) {
    console.error('Error during auto-login:', err);
  }

  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      errMsg = errorData.message || errMsg;
    } catch {
      // Keep default error message
    }
    throw new Error(errMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const collectionsService = {
  async getCollections(query: CollectionQuery = {}): Promise<PaginatedCollections> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.search) params.set('search', query.search);
    if (query.isActive !== undefined) params.set('isActive', query.isActive.toString());
    if (query.showOnHomePage !== undefined) params.set('showOnHomePage', query.showOnHomePage.toString());

    const qs = params.toString();
    return request<PaginatedCollections>(`/admin/collections${qs ? `?${qs}` : ''}`);
  },

  async getCollection(id: string): Promise<CollectionItem> {
    return request<CollectionItem>(`/admin/collections/${id}`);
  },

  async createCollection(payload: CollectionPayload): Promise<CollectionItem> {
    return request<CollectionItem>('/admin/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCollection(id: string, payload: Partial<CollectionPayload>): Promise<CollectionItem> {
    return request<CollectionItem>(`/admin/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteCollection(id: string): Promise<void> {
    await request<void>(`/admin/collections/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadBannerImage(file: File): Promise<{ imageUrl: string; filename: string }> {
    const token = await ensureValidToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/admin/collections/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      let errMsg = `Upload failed: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errMsg = errorData.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    return res.json();
  },
};
