export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  getAccessToken?: () => string | null;
  getDeviceId?: () => string | null;
  onRefreshToken?: () => Promise<string | null>;
  onAuthFailure?: (error: unknown) => void;
}

let clientConfig: ApiClientConfig = {
  baseUrl: 'http://localhost:3001',
  timeoutMs: 15_000,
};

let refreshInFlight: Promise<string | null> | null = null;

export function configureApiClient(nextConfig: Partial<ApiClientConfig>): void {
  clientConfig = {
    ...clientConfig,
    ...nextConfig,
    baseUrl: (nextConfig.baseUrl ?? clientConfig.baseUrl).replace(/\/+$/, ''),
  };
}

export function getApiClientConfig(): ApiClientConfig {
  return clientConfig;
}

export function resetRefreshLockForTests(): void {
  refreshInFlight = null;
}

function resolveRequestUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalizedBase = clientConfig.baseUrl.replace(/\/+$/, '');
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  // Avoid duplicating /api/v1 if baseUrl already includes it and Orval path starts with /api/v1
  if (normalizedBase.endsWith('/api/v1') && normalizedPath.startsWith('/api/v1/')) {
    return `${normalizedBase.slice(0, -'/api/v1'.length)}${normalizedPath}`;
  }
  return `${normalizedBase}${normalizedPath}`;
}

function isAuthRefreshOrLoginPath(url: string): boolean {
  return (
    url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/auth/phone/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/phone/register')
  );
}

async function parseErrorBody(response: Response): Promise<{ message: string; data: unknown }> {
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  let message = response.statusText || 'Request failed';
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const rawMsg = obj.message ?? obj.error;
    if (Array.isArray(rawMsg)) {
      message = rawMsg.map(String).join(', ');
    } else if (typeof rawMsg === 'string' && rawMsg.trim().length > 0) {
      message = rawMsg;
    }
  }

  return { message, data };
}

async function runSingleFlightRefresh(): Promise<string | null> {
  if (!clientConfig.onRefreshToken) {
    return null;
  }
  if (!refreshInFlight) {
    refreshInFlight = clientConfig
      .onRefreshToken()
      .catch((err) => {
        clientConfig.onAuthFailure?.(err);
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export interface CustomFetchOptions extends RequestInit {
  timeoutMs?: number;
  _retry?: boolean;
}

export async function customFetch<T>(
  url: string,
  options: CustomFetchOptions = {},
): Promise<T> {
  const fullUrl = resolveRequestUrl(url);
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (
    !headers.has('Content-Type') &&
    options.body !== undefined &&
    !(typeof FormData !== 'undefined' && options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const token = clientConfig.getAccessToken?.();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const deviceId = clientConfig.getDeviceId?.();
  if (deviceId && !headers.has('X-Device-Id')) {
    headers.set('X-Device-Id', deviceId);
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? clientConfig.timeoutMs ?? 15_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (
      response.status === 401 &&
      !options._retry &&
      !isAuthRefreshOrLoginPath(url) &&
      clientConfig.onRefreshToken
    ) {
      const nextToken = await runSingleFlightRefresh();
      if (nextToken) {
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set('Authorization', `Bearer ${nextToken}`);
        return customFetch<T>(url, {
          ...options,
          headers: retryHeaders,
          _retry: true,
        });
      }
      clientConfig.onAuthFailure?.(new ApiError(401, 'Session expired. Please log in again.'));
    }

    if (!response.ok) {
      const { message, data } = await parseErrorBody(response);
      throw new ApiError(response.status, message, data);
    }

    if (response.status === 204) {
      return { data: undefined, status: 204, headers: response.headers } as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    // Orval v8 fetch client expects { data, status, headers } envelope
    return {
      data,
      status: response.status,
      headers: response.headers,
    } as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please check your internet connection.', err);
    }
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(0, msg, err);
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
