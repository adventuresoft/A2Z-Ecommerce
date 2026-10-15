'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AuthUser,
  getProfileApi,
  getStoredTokens,
  getStoredUser,
  loginApi,
  logoutApi,
  LoginPayload,
} from '../services/auth';
import { AppModule, ModuleAction, checkPermission } from '../config/permissions';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  can: (module: AppModule, action: ModuleAction) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      const cached = getStoredUser();
      const tokens = getStoredTokens();

      if (cached && tokens.accessToken) {
        setUser(cached);
      }

      if (tokens.accessToken) {
        try {
          const fresh = await getProfileApi();
          if (fresh) {
            setUser(fresh);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await loginApi(payload);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    router.push('/login');
  }, [router]);

  const can = useCallback(
    (module: AppModule, action: ModuleAction): boolean => {
      return checkPermission(user?.role, module, action);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
