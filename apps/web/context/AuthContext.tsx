'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  apiClient,
  setAccessToken,
  getAccessToken,
  ApiError,
} from '../lib/api-client';

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: CustomerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<CustomerUser>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<CustomerUser>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<CustomerUser>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (): Promise<CustomerUser | null> => {
    try {
      const profile = await apiClient.get<CustomerUser>('/account/profile');
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiClient.post<{ accessToken: string; user?: CustomerUser }>(
        '/auth/refresh',
        {},
        { skipAuth: true },
      );
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        if (res.user) {
          setUser(res.user);
        } else {
          await fetchProfile();
        }
        return true;
      }
      return false;
    } catch {
      setAccessToken(null);
      setUser(null);
      return false;
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        await refreshSession();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  const login = useCallback(
    async (credentials: { email: string; password: string }): Promise<CustomerUser> => {
      const res = await apiClient.post<{
        accessToken: string;
        refreshToken?: string;
        user: CustomerUser;
      }>('/auth/login', credentials, { skipAuth: true });

      setAccessToken(res.accessToken);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
    }): Promise<CustomerUser> => {
      const res = await apiClient.post<any>('/auth/register', data, {
        skipAuth: true,
      });

      if (res.accessToken) {
        setAccessToken(res.accessToken);
      }

      const userData: CustomerUser =
        res.user || {
          id: res.id,
          email: res.email,
          name: res.name,
          phone: res.phone,
          role: res.role,
        };

      setUser(userData);
      return userData;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore network failures on logout
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: { name?: string; phone?: string }): Promise<CustomerUser> => {
      const updated = await apiClient.patch<CustomerUser>('/account/profile', data);
      setUser(updated);
      return updated;
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      refreshSession,
    }),
    [user, isLoading, login, register, logout, updateProfile, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
