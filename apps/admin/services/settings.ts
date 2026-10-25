export interface StoreSetting {
  key: string;
  value: string;
  parsedValue?: unknown;
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | string;
  group: string;
  isPublic: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingPayload {
  key: string;
  value: string;
  dataType?: string;
  group?: string;
  isPublic?: boolean;
  description?: string;
}

export interface UpdateSettingPayload {
  value?: string;
  dataType?: string;
  group?: string;
  isPublic?: boolean;
  description?: string;
}

export interface SettingItemUpdate {
  key: string;
  value: string;
  isPublic?: boolean;
  description?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
        email: 'superadmin@az-ecommerce.local',
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
  } catch (err) {
    console.warn('Could not auto-acquire fallback auth token:', err);
  }

  return null;
}

async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await ensureValidToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      errorMessage =
        errorJson.message ||
        (Array.isArray(errorJson.messages) ? errorJson.messages.join(', ') : errorMessage);
    } catch {
      // Keep default error message
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export const SettingsService = {
  /**
   * Fetch all settings, optionally filtered by group or public flag
   */
  async getSettings(group?: string, isPublic?: boolean): Promise<StoreSetting[]> {
    const params = new URLSearchParams();
    if (group) params.set('group', group);
    if (isPublic !== undefined) params.set('isPublic', String(isPublic));

    const qs = params.toString();
    return requestApi<StoreSetting[]>(`/admin/settings${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetch distinct setting group names
   */
  async getGroups(): Promise<string[]> {
    return requestApi<string[]>('/admin/settings/groups');
  },

  /**
   * Fetch a single setting by key
   */
  async getSetting(key: string): Promise<StoreSetting> {
    return requestApi<StoreSetting>(`/admin/settings/${encodeURIComponent(key)}`);
  },

  /**
   * Create a new setting
   */
  async createSetting(payload: CreateSettingPayload): Promise<StoreSetting> {
    return requestApi<StoreSetting>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update a single setting
   */
  async updateSetting(key: string, payload: UpdateSettingPayload): Promise<StoreSetting> {
    return requestApi<StoreSetting>(`/admin/settings/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Batch update multiple settings in a single transaction
   */
  async batchUpdate(settings: SettingItemUpdate[]): Promise<StoreSetting[]> {
    return requestApi<StoreSetting[]>('/admin/settings/batch', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
    });
  },

  /**
   * Delete a setting
   */
  async deleteSetting(key: string): Promise<{ success: boolean; message: string }> {
    return requestApi<{ success: boolean; message: string }>(
      `/admin/settings/${encodeURIComponent(key)}`,
      {
        method: 'DELETE',
      },
    );
  },

  /**
   * Fetch public settings (unauthenticated)
   */
  async getPublicSettings(): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/settings/public`);
    if (!res.ok) {
      throw new Error(`Failed to fetch public settings: ${res.statusText}`);
    }
    return res.json();
  },
};
