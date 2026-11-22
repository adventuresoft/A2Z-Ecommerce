import { create } from 'zustand';
import type { AuthUserSummaryDto } from '@repo/api-client';

// Access token lives strictly in memory (never MMKV or AsyncStorage)
let inMemoryAccessToken: string | null = null;

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setInMemoryAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export interface AuthState {
  user: AuthUserSummaryDto | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSessionUser: (user: AuthUserSummaryDto | null) => void;
  setHydrated: (hydrated: boolean) => void;
  clearSessionState: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setSessionUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  clearSessionState: () => {
    inMemoryAccessToken = null;
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
