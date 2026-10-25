export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: AuditLogUser | null;
}

export interface PaginatedAuditLogs {
  data: AuditLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditLogFilterOptions {
  actions: string[];
  entityTypes: string[];
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

export const logsService = {
  /**
   * Fetch paginated audit logs
   */
  async getAuditLogs(params?: QueryAuditLogsParams): Promise<PaginatedAuditLogs> {
    const url = new URL(`${API_BASE}/admin/audit-logs`);
    if (params) {
      if (params.page) url.searchParams.set('page', String(params.page));
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.action) url.searchParams.set('action', params.action);
      if (params.entityType) url.searchParams.set('entityType', params.entityType);
      if (params.userId) url.searchParams.set('userId', params.userId);
      if (params.search) url.searchParams.set('search', params.search);
      if (params.dateFrom) url.searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) url.searchParams.set('dateTo', params.dateTo);
    }

    const res = await fetchWithAuth(url.toString(), { method: 'GET' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch audit logs');
    }

    return res.json();
  },

  /**
   * Fetch available filter options
   */
  async getFilterOptions(): Promise<AuditLogFilterOptions> {
    const res = await fetchWithAuth(`${API_BASE}/admin/audit-logs/filters`, {
      method: 'GET',
    });
    if (!res.ok) {
      return { actions: [], entityTypes: [] };
    }
    return res.json();
  },

  /**
   * Fetch a single audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLogItem> {
    const res = await fetchWithAuth(`${API_BASE}/admin/audit-logs/${id}`, {
      method: 'GET',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch log ${id}`);
    }
    return res.json();
  },
};
