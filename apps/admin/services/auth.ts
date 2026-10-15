export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SHOP_MANAGER' | 'CUSTOMER';
  phone?: string | null;
  isActive?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const TOKEN_KEY = 'az_admin_access_token';
export const REFRESH_TOKEN_KEY = 'az_admin_refresh_token';
export const USER_KEY = 'az_admin_user';

export function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setStoredTokens(tokens: { accessToken: string; refreshToken: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  document.cookie = `${TOKEN_KEY}=${tokens.accessToken}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearStoredTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  // Reject customer logins on admin panel
  if (data.user.role === 'CUSTOMER') {
    throw new Error('Access denied: Customer accounts cannot access the admin panel');
  }

  setStoredTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  setStoredUser(data.user);
  return data;
}

export async function refreshApi(): Promise<AuthTokens | null> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearStoredTokens();
      return null;
    }

    const data = await res.json();
    setStoredTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    if (data.user) {
      setStoredUser(data.user);
    }
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    clearStoredTokens();
    return null;
  }
}

export async function getProfileApi(): Promise<AuthUser | null> {
  const { accessToken } = getStoredTokens();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401) {
      const refreshed = await refreshApi();
      if (refreshed) {
        return getProfileApi();
      }
      return null;
    }

    if (!res.ok) return null;
    const user = await res.json();
    setStoredUser(user);
    return user;
  } catch {
    return null;
  }
}

export async function logoutApi(): Promise<void> {
  const { accessToken } = getStoredTokens();
  if (accessToken) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  clearStoredTokens();
}
