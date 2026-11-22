import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from './auth-store';

export function useRequireAuth() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const requireAuth = useCallback(
    (redirectPath: string, onAuthed?: () => void): boolean => {
      if (isAuthenticated) {
        onAuthed?.();
        return true;
      }
      router.push({
        pathname: '/(auth)/login' as never,
        params: { redirect: redirectPath },
      } as never);
      return false;
    },
    [isAuthenticated, router],
  );

  return { isAuthenticated, requireAuth };
}
