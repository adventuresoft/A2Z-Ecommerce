export interface NormalizedPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

/**
 * Normalizes both backend pagination envelopes:
 * 1) { items, total, page, limit, totalPages } (products, notifications)
 * 2) { data, meta: { total, page, limit, totalPages } } (orders)
 */
export function normalizePage<T>(raw: unknown): NormalizedPage<T> {
  if (!raw || typeof raw !== 'object') {
    return { items: [], total: 0, page: 1, limit: 12, totalPages: 1, hasNextPage: false };
  }
  const record = raw as Record<string, unknown>;

  if (Array.isArray(record.items)) {
    const page = Number(record.page ?? 1);
    const limit = Number(record.limit ?? (record.items.length || 12));
    const total = Number(record.total ?? record.items.length);
    const totalPages = Math.max(1, Number(record.totalPages ?? Math.ceil(total / Math.max(1, limit))));
    return {
      items: record.items as T[],
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  if (Array.isArray(record.data)) {
    const meta = (record.meta as Record<string, unknown> | undefined) ?? {};
    const page = Number(meta.page ?? 1);
    const limit = Number(meta.limit ?? (record.data.length || 12));
    const total = Number(meta.total ?? record.data.length);
    const totalPages = Math.max(1, Number(meta.totalPages ?? Math.ceil(total / Math.max(1, limit))));
    return {
      items: record.data as T[],
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  return { items: [], total: 0, page: 1, limit: 12, totalPages: 1, hasNextPage: false };
}

export type MediaVariantSize = 'original' | 'medium' | 'thumb';

/**
 * Resolves relative `/uploads/...` URLs against API origin and optionally selects
 * backend-generated WebP derivatives (`-thumb.webp` / `-md.webp`).
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  apiOrigin: string,
  size: MediaVariantSize = 'original',
): string | null {
  if (!path || !path.trim()) return null;
  let cleaned = path.trim();

  if (size !== 'original' && cleaned.endsWith('.webp') && !cleaned.endsWith('-thumb.webp') && !cleaned.endsWith('-md.webp')) {
    const suffix = size === 'thumb' ? '-thumb.webp' : '-md.webp';
    cleaned = cleaned.replace(/\.webp$/i, suffix);
  }

  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  const origin = apiOrigin.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
  const relative = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return `${origin}${relative}`;
}
