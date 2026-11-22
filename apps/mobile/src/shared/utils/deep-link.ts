import { z } from 'zod';

const SAFE_SLUG = z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/);
const SAFE_ID = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const SAFE_TRACKING = z.string().regex(/^[a-zA-Z0-9_-]{3,80}$/);

const ALLOWED_HOSTS = new Set([
  'atozecommerce.com',
  'www.atozecommerce.com',
  'staging.atozecommerce.com',
]);

/**
 * Sanitizes any push notification linkUrl, custom-scheme deep link, or universal link
 * into a strictly allowlisted internal Expo Router path. Returns null for unsafe/external links.
 */
export function resolveSafeInternalRoute(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.includes('\\')) return null;

  let pathname = trimmed;
  let search = '';

  if (trimmed.startsWith('azecommerce://')) {
    const withoutScheme = trimmed.slice('azecommerce://'.length);
    const qIdx = withoutScheme.indexOf('?');
    pathname = '/' + (qIdx === -1 ? withoutScheme : withoutScheme.slice(0, qIdx)).replace(/^\/+/, '');
    search = qIdx === -1 ? '' : withoutScheme.slice(qIdx);
  } else if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    try {
      const parsed = new URL(trimmed);
      if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
        return null;
      }
      pathname = parsed.pathname;
      search = parsed.search;
    } catch {
      return null;
    }
  } else if (trimmed.startsWith('/')) {
    const qIdx = trimmed.indexOf('?');
    pathname = qIdx === -1 ? trimmed : trimmed.slice(0, qIdx);
    search = qIdx === -1 ? '' : trimmed.slice(qIdx);
  } else {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/(tabs)';

  const [first, second] = segments;

  if (first === 'product' && second && SAFE_SLUG.safeParse(second).success) {
    return `/product/${second}`;
  }
  if (first === 'category' && second && SAFE_SLUG.safeParse(second).success) {
    return `/category/${second}`;
  }
  if (first === 'collection' && second && SAFE_SLUG.safeParse(second).success) {
    return `/collection/${second}`;
  }
  if (first === 'orders') {
    if (!second) return '/orders';
    if (SAFE_ID.safeParse(second).success) return `/orders/${second}`;
    return null;
  }
  if (first === 'track' && second && SAFE_TRACKING.safeParse(second).success) {
    return `/track/${second}`;
  }
  if (first === 'notifications') {
    return '/notifications';
  }
  if (first === 'checkout' && second === 'payment-callback') {
    const params = new URLSearchParams(search);
    const invoice = params.get('invoice_number');
    if (invoice && SAFE_ID.safeParse(invoice).success) {
      return `/checkout/payment-callback?invoice_number=${encodeURIComponent(invoice)}`;
    }
    return '/checkout/payment-callback';
  }

  return null;
}
