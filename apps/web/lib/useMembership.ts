'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { membershipClient, type MembershipStatus } from './membership-client';

/** Current user's membership. Safe to call when logged out (returns inactive). */
export function useMembership() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setMembership(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setMembership(await membershipClient.getMine());
    } catch (err: any) {
      setError(err?.message || 'Could not load your membership.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return {
    membership,
    isMember: Boolean(membership?.isActive),
    isLoading: authLoading || isLoading,
    error,
    refresh,
  };
}

