export type AttributeType = 'TEXT' | 'COLOR' | 'BUTTON';

export interface AttributeValueItem {
  id: string;
  attributeId: string;
  value: string;
  label?: string | null;
  colorCode?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeItem {
  id: string;
  name: string;
  slug: string;
  type: AttributeType;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  values: AttributeValueItem[];
  counts?: {
    products: number;
    variants: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttributeQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: AttributeType;
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAttributes {
  items: AttributeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAttributeValueInput {
  value: string;
  label?: string;
  colorCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateAttributePayload {
  name: string;
  slug?: string;
  type?: AttributeType;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  values?: CreateAttributeValueInput[];
}

export type UpdateAttributePayload = Partial<CreateAttributePayload>;

export type UpdateAttributeValuePayload = Partial<CreateAttributeValueInput>;

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

  if (!headers.has('Content-Type')) {
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
      `Cannot connect to API server at ${API_BASE}. Please ensure the NestJS backend is running.`,
    );
  }

  if (res.status === 401 && !isRetry && typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    const newToken = await ensureValidToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      if (!retryHeaders.has('Content-Type')) {
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

export const attributesApi = {
  async getAttributes(query: AttributeQuery = {}): Promise<PaginatedAttributes> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.type) params.set('type', query.type);
    if (query.isActive !== undefined) {
      params.set('isActive', String(query.isActive));
    }
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const url = `${API_BASE}/admin/attributes?${params.toString()}`;
    const res = await fetchWithAuth(url, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<PaginatedAttributes>(res);
  },

  async getAttribute(id: string): Promise<AttributeItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/attributes/${id}`, {
      method: 'GET',
      cache: 'no-store',
    });
    return handleResponse<AttributeItem>(res);
  },

  async createAttribute(payload: CreateAttributePayload): Promise<AttributeItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/attributes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<AttributeItem>(res);
  },

  async updateAttribute(
    id: string,
    payload: UpdateAttributePayload,
  ): Promise<AttributeItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/attributes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return handleResponse<AttributeItem>(res);
  },

  async toggleStatus(id: string, isActive: boolean): Promise<AttributeItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/attributes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return handleResponse<AttributeItem>(res);
  },

  async deleteAttribute(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/attributes/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async createValue(
    attributeId: string,
    payload: CreateAttributeValueInput,
  ): Promise<AttributeValueItem> {
    const res = await fetchWithAuth(
      `${API_BASE}/admin/attributes/${attributeId}/values`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<AttributeValueItem>(res);
  },

  async updateValue(
    attributeId: string,
    valueId: string,
    payload: UpdateAttributeValuePayload,
  ): Promise<AttributeValueItem> {
    const res = await fetchWithAuth(
      `${API_BASE}/admin/attributes/${attributeId}/values/${valueId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
    return handleResponse<AttributeValueItem>(res);
  },

  async deleteValue(
    attributeId: string,
    valueId: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(
      `${API_BASE}/admin/attributes/${attributeId}/values/${valueId}`,
      {
        method: 'DELETE',
      },
    );
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
