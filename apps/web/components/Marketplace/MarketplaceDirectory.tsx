'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import {
  filtersFromParams,
  marketplaceClient,
  toQueryString,
  type MarketplaceCard,
  type MarketplaceFilters,
  type MarketplaceSort,
} from '../../lib/marketplace-client';
import { useMembership } from '../../lib/useMembership';
import { FilterPanel } from './FilterPanel';
import { FreelancerCard } from './FreelancerCard';
import { EmptyState, ErrorState, PageSkeleton } from './States';

const SORTS: Array<{ value: MarketplaceSort; label: string }> = [
  { value: 'default', label: 'Best match' },
  { value: 'top_rated', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'experience', label: 'Most experienced' },
];

function getPaginationRange(current: number, total: number): Array<number | '...'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function MarketplaceDirectory() {
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
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState(applied.search ?? '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
      setTotal(res.total ?? res.items.length);
      setCurrentPage(res.page ?? 1);
      setTotalPages(res.totalPages ?? 1);
      setPageSize(res.limit ?? 12);
    } catch (err: any) {
      if (id !== requestId.current) return;
      setError(err?.message || 'Could not load professionals.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [appliedKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => setSearchText(applied.search ?? ''), [applied.search]);

  const goToPage = (newPage: number) => {
    pushFilters({ ...applied, page: String(newPage) });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const hasFilters = Object.keys(applied).some(
    (k) => k !== 'sort' && k !== 'page' && k !== 'limit',
  );

  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Header & Professional Action Hero */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm border border-slate-800">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-2">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            A to Z Professional Services
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Hire a Professional • দক্ষ পেশাদার খুঁজুন
          </h1>
          <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-slate-300 leading-relaxed">
            ইলেকট্রিশিয়ান, প্লাম্বার, টেকনিশিয়ান সহ বিশ্বস্ত পেশাদারদের সেবা নিন সরাসরি কোনো মধ্যস্থতাকারী ছাড়া।
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/freelancer/onboarding"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition"
          >
            <span>পেশাদার হিসেবে যোগ দিন</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Search, View Mode and Sort Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <form
          role="search"
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            pushFilters({ ...applied, search: searchText.trim(), page: '1' });
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

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Grid vs List */}
          <div
            className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs"
            role="group"
            aria-label="View layout mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Card view"
              aria-pressed={viewMode === 'grid'}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <label htmlFor="hire-sort" className="sr-only">
            Sort by
          </label>
          <select
            id="hire-sort"
            value={applied.sort ?? 'default'}
            onChange={(e) =>
              pushFilters({ ...applied, sort: e.target.value as MarketplaceSort, page: '1' })
            }
            className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary sm:flex-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
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
          className={`${
            filtersOpen ? 'block' : 'hidden'
          } rounded-lg border border-slate-200 bg-white p-4 lg:block lg:self-start`}
        >
          <FilterPanel
            applied={applied}
            onApply={(next) => {
              pushFilters({ ...next, search: applied.search, sort: applied.sort, page: '1' });
              setFiltersOpen(false);
            }}
            onClear={() => {
              pushFilters({ sort: applied.sort, page: '1' });
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
              body={
                hasFilters
                  ? 'Try a wider area or fewer filters.'
                  : 'No professionals are listed yet. Check back soon.'
              }
              action={
                hasFilters
                  ? { label: 'Clear filters', onClick: () => pushFilters({ page: '1' }) }
                  : undefined
              }
            />
          ) : (
            <>
              {/* Results count & Page Size info bar */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                <p className="text-xs font-medium text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {(currentPage - 1) * pageSize + 1}
                  </span>
                  –
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {Math.min(currentPage * pageSize, total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-800 tabular-nums">{total}</span>{' '}
                  verified professionals
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <label htmlFor="per-page-select">Per page:</label>
                  <select
                    id="per-page-select"
                    value={applied.limit ?? pageSize}
                    onChange={(e) => {
                      pushFilters({ ...applied, limit: e.target.value, page: '1' });
                    }}
                    className="rounded-md border border-slate-200 bg-white py-1 px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                  </select>
                </div>
              </div>

              {/* Items List / Grid */}
              <ul
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
                    : 'space-y-3'
                }
              >
                {items.map((f) => (
                  <FreelancerCard
                    key={f.id}
                    freelancer={f}
                    isMember={isMember}
                    membershipLoading={membershipLoading}
                    layout={viewMode}
                  />
                ))}
              </ul>

              {/* Numbered Pagination Navigation */}
              {totalPages > 1 && (
                <nav
                  aria-label="Marketplace pagination"
                  className="mt-8 flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-100 pt-6"
                >
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30 transition focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {paginationRange.map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span
                          key={`dots-${idx}`}
                          className="inline-flex h-9 w-7 items-center justify-center text-xs text-slate-400 select-none"
                        >
                          …
                        </span>
                      );
                    }
                    const isActive = p === currentPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => goToPage(p)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold tabular-nums transition focus-visible:outline-2 focus-visible:outline-primary cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30 transition focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
