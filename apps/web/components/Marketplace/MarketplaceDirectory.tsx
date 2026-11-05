'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import {
  filtersFromParams,
  marketplaceClient,
  toQueryString,
  type MarketplaceCard,
  type MarketplaceFilters,
  type MarketplaceSort,
} from '../../lib/marketplace-client';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { useMembership } from '../../lib/useMembership';
import { FilterPanel } from './FilterPanel';
import { FreelancerCard } from './FreelancerCard';
import { EmptyState, ErrorState, PageSkeleton } from './States';

const SORTS: Array<{ value: MarketplaceSort; label: string }> = [
  { value: 'default', label: 'Best match' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'experience', label: 'Most experienced' },
];

export function MarketplaceDirectory() {
  const { ready } = useRequireAuth();
  const { isMember, isLoading: membershipLoading } = useMembership();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const appliedKey = searchParams.toString();
  const applied = useMemo(
    () => filtersFromParams(new URLSearchParams(appliedKey)),
    [appliedKey],
  );

  const [items, setItems] = useState<MarketplaceCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState(applied.search ?? '');
  const requestId = useRef(0);

  const pushFilters = useCallback(
    (next: MarketplaceFilters) => {
      const qs = toQueryString(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname],
  );

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await marketplaceClient.list(filtersFromParams(new URLSearchParams(appliedKey)));
      if (id !== requestId.current) return;
      setItems(res.items);
      setCursor(res.nextCursor);
    } catch (err: any) {
      if (id !== requestId.current) return;
      setError(err?.message || 'Could not load professionals.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [appliedKey]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  useEffect(() => setSearchText(applied.search ?? ''), [applied.search]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await marketplaceClient.list(applied, cursor);
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.items.filter((i) => !seen.has(i.id))];
      });
      setCursor(res.nextCursor);
    } catch (err: any) {
      setError(err?.message || 'Could not load more.');
    } finally {
      setLoadingMore(false);
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PageSkeleton />
      </div>
    );
  }

  const hasFilters = Object.keys(applied).some((k) => k !== 'sort');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Hire a professional</h1>
        <p className="mt-1 max-w-prose text-sm text-slate-600">
          Electricians, plumbers, technicians and more, near you. Browsing is free. Members can see phone numbers and send messages.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <form
          role="search"
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            pushFilters({ ...applied, search: searchText.trim() });
          }}
        >
          <label htmlFor="hire-search" className="sr-only">
            Search by name or title
          </label>
          <input
            id="hire-search"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name or title"
            className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          />
          <button
            type="submit"
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <label htmlFor="hire-sort" className="sr-only">
            Sort by
          </label>
          <select
            id="hire-sort"
            value={applied.sort ?? 'default'}
            onChange={(e) => pushFilters({ ...applied, sort: e.target.value as MarketplaceSort })}
            className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary sm:flex-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="hire-filters"
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside
          id="hire-filters"
          className={`${filtersOpen ? 'block' : 'hidden'} rounded-lg border border-slate-200 bg-white p-4 lg:block lg:self-start`}
        >
          <FilterPanel
            applied={applied}
            onApply={(next) => {
              pushFilters({ ...next, search: applied.search, sort: applied.sort });
              setFiltersOpen(false);
            }}
            onClear={() => {
              pushFilters({ sort: applied.sort });
              setFiltersOpen(false);
            }}
          />
        </aside>

        <section aria-live="polite" aria-busy={loading}>
          {error && <ErrorState message={error} onRetry={load} />}

          {loading ? (
            <PageSkeleton />
          ) : items.length === 0 && !error ? (
            <EmptyState
              title="No professionals match these filters"
              body={hasFilters ? 'Try a wider area or fewer filters.' : 'No professionals are listed yet. Check back soon.'}
              action={hasFilters ? { label: 'Clear filters', onClick: () => pushFilters({}) } : undefined}
            />
          ) : (
            <>
              <ul className="space-y-3">
                {items.map((f) => (
                  <FreelancerCard
                    key={f.id}
                    freelancer={f}
                    isMember={isMember}
                    membershipLoading={membershipLoading}
                  />
                ))}
              </ul>
              {cursor && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="min-h-11 rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
