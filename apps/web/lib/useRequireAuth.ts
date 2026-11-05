'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

/** Builds the login URL that returns the user to `target` afterwards. */
export function loginUrlFor(target: string): string {
  return `/login?redirect=${encodeURIComponent(target)}`;
}

/**
 * Redirects visitors to login (with a return URL). `ready` is true only once
 * the session has resolved and the user is signed in, so callers can show a
 * skeleton until then. The API stays the real gate.
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const fullPath = search ? `${pathname}${search}` : pathname;
    router.replace(loginUrlFor(fullPath));
  }, [isLoading, isAuthenticated, router, pathname]);

  return { ready: !isLoading && isAuthenticated };
}

