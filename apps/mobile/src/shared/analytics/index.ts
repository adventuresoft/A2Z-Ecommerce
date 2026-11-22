import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import { env } from '../config/env';

let posthogClient: PostHog | null = null;
let initialized = false;

const SENSITIVE_KEYS = new Set([
  'authorization',
  'password',
  'refreshtoken',
  'accesstoken',
  'token',
  'otp',
  'code',
  'phone',
  'email',
]);

function redactObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = redactObject(value);
    }
  }
  return out;
}

export function initObservability(): void {
  if (initialized) return;
  initialized = true;

  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.APP_ENV,
      tracesSampleRate: env.isProduction ? 0.2 : 1.0,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request?.headers) {
          event.request.headers = redactObject(event.request.headers) as Record<string, string>;
        }
        if (event.extra) {
          event.extra = redactObject(event.extra) as Record<string, unknown>;
        }
        return event;
      },
    });
  }

  if (env.POSTHOG_KEY) {
    posthogClient = new PostHog(env.POSTHOG_KEY, {
      host: env.POSTHOG_HOST,
    });
  }
}

export type EcommerceEventName =
  | 'product_viewed'
  | 'search_performed'
  | 'filter_applied'
  | 'add_to_cart'
  | 'wishlist_toggled'
  | 'coupon_applied'
  | 'begin_checkout'
  | 'order_created'
  | 'payment_completed'
  | 'payment_failed'
  | 'order_cancelled';

export const analytics = {
  identify(userId: string, traits?: Record<string, string | number | boolean>) {
    Sentry.setUser({ id: userId });
    posthogClient?.identify(userId, traits);
  },

  reset() {
    Sentry.setUser(null);
    posthogClient?.reset();
  },

  screen(name: string, properties?: Record<string, string | number | boolean>) {
    Sentry.addBreadcrumb({ category: 'navigation', message: name, level: 'info' });
    posthogClient?.screen(name, properties);
  },

  track(event: EcommerceEventName, properties?: Record<string, string | number | boolean | null>) {
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: event,
      data: properties ?? undefined,
      level: 'info',
    });
    const safeProps: Record<string, string | number | boolean> = {};
    if (properties) {
      for (const [k, v] of Object.entries(properties)) {
        if (v !== null && v !== undefined) {
          safeProps[k] = v;
        }
      }
    }
    posthogClient?.capture(event, safeProps);
  },

  captureError(error: unknown, context?: Record<string, unknown>) {
    Sentry.captureException(error, {
      extra: context ? (redactObject(context) as Record<string, unknown>) : undefined,
    });
  },
};
