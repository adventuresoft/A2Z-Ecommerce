import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ApiError,
  configureApiClient,
  customFetch,
  resetRefreshLockForTests,
} from './mutator.js';
import { normalizePage, resolveMediaUrl } from './helpers.js';

describe('@repo/api-client mutator & helpers', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetRefreshLockForTests();
    configureApiClient({
      baseUrl: 'https://api.atozecommerce.com',
      timeoutMs: 5000,
      getAccessToken: () => 'expired-access-token',
      getDeviceId: () => 'pixel-7',
      onRefreshToken: undefined,
      onAuthFailure: undefined,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('deduplicates concurrent 401 refresh calls via single-flight lock and retries all queued callers', async () => {
    let activeToken = 'expired-token';
    const onRefreshToken = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 25));
      activeToken = 'fresh-token';
      return activeToken;
    });

    configureApiClient({
      baseUrl: 'https://api.atozecommerce.com',
      getAccessToken: () => activeToken,
      onRefreshToken,
    });

    globalThis.fetch = vi.fn(async (_url: any, init?: RequestInit) => {
      const authHeader = new Headers(init?.headers).get('Authorization');
      if (authHeader === 'Bearer fresh-token') {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }) as any;

    const results = await Promise.all([
      customFetch<{ data: { ok: boolean } }>('/api/v1/cart'),
      customFetch<{ data: { ok: boolean } }>('/api/v1/wishlist'),
      customFetch<{ data: { ok: boolean } }>('/api/v1/notifications/unread-count'),
    ]);

    expect(onRefreshToken).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.data.ok)).toBe(true);
  });

  it('parses NestJS array validation errors into ApiError', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ statusCode: 400, message: ['phone is invalid', 'password too short'] }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    ) as any;

    await expect(customFetch('/api/v1/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'phone is invalid, password too short',
    });
  });

  it('invokes onAuthFailure when refresh returns null', async () => {
    const onAuthFailure = vi.fn();
    configureApiClient({
      baseUrl: 'https://api.atozecommerce.com',
      getAccessToken: () => 'expired-token',
      onRefreshToken: vi.fn().mockResolvedValue(null),
      onAuthFailure,
    });

    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    ) as any;

    await expect(customFetch('/api/v1/orders')).rejects.toBeInstanceOf(ApiError);
    expect(onAuthFailure).toHaveBeenCalled();
  });

  it('normalizes both { items, total } and { data, meta } pagination envelopes', () => {
    const productsPage = normalizePage<{ id: string }>({
      items: [{ id: 'p1' }, { id: 'p2' }],
      total: 25,
      page: 1,
      limit: 12,
      totalPages: 3,
    });
    expect(productsPage.hasNextPage).toBe(true);
    expect(productsPage.items).toHaveLength(2);

    const ordersPage = normalizePage<{ id: string }>({
      data: [{ id: 'o1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    expect(ordersPage.hasNextPage).toBe(false);
    expect(ordersPage.items[0].id).toBe('o1');
  });

  it('resolves relative /uploads paths and WebP derivative sizes cleanly', () => {
    expect(
      resolveMediaUrl('/uploads/products/watch.webp', 'https://api.atozecommerce.com/api/v1', 'thumb'),
    ).toBe('https://api.atozecommerce.com/uploads/products/watch-thumb.webp');

    expect(
      resolveMediaUrl('/uploads/products/watch.webp', 'https://api.atozecommerce.com', 'medium'),
    ).toBe('https://api.atozecommerce.com/uploads/products/watch-md.webp');

    expect(
      resolveMediaUrl('https://cdn.example.com/pic.jpg', 'https://api.atozecommerce.com'),
    ).toBe('https://cdn.example.com/pic.jpg');

    expect(resolveMediaUrl(null, 'https://api.atozecommerce.com')).toBeNull();
  });
});
