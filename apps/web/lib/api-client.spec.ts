import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiClient,
  setAccessToken,
  getAccessToken,
  ApiError,
} from './api-client';

describe('apiClient', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it('manages in-memory access token correctly', () => {
    assert.equal(getAccessToken(), null);
    setAccessToken('test-token-123');
    assert.equal(getAccessToken(), 'test-token-123');
    setAccessToken(null);
    assert.equal(getAccessToken(), null);
  });

  it('attaches Authorization header and credentials: include', async () => {
    setAccessToken('valid-jwt-token');

    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    global.fetch = async (url: any, init?: any) => {
      capturedUrl = String(url);
      capturedInit = init;
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as any;
    };

    const res = await apiClient.get('/test-endpoint');
    assert.deepEqual(res, { success: true });
    assert.ok(capturedUrl.includes('/test-endpoint'));
    assert.equal(capturedInit?.credentials, 'include');
    assert.equal(
      (capturedInit?.headers as Headers).get('Authorization'),
      'Bearer valid-jwt-token',
    );
  });

  it('transparently refreshes token on 401 and replays request', async () => {
    setAccessToken('expired-token');

    let refreshCalled = false;
    let requestsCount = 0;

    global.fetch = async (url: any) => {
      requestsCount++;
      const urlStr = String(url);

      if (urlStr.includes('/auth/refresh')) {
        refreshCalled = true;
        return {
          ok: true,
          status: 200,
          json: async () => ({ accessToken: 'new-fresh-token' }),
        } as any;
      }

      if (urlStr.includes('/protected-data') && !refreshCalled) {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Token expired' }),
        } as any;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ secret: 'top-secret-data' }),
      } as any;
    };

    const result = await apiClient.get('/protected-data');
    assert.deepEqual(result, { secret: 'top-secret-data' });
    assert.equal(getAccessToken(), 'new-fresh-token');
    assert.equal(requestsCount, 3);
  });

  it('throws ApiError on failed request without retry for auth endpoints', async () => {
    global.fetch = async () =>
      ({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid credentials' }),
      }) as any;

    await assert.rejects(
      async () => {
        await apiClient.post('/auth/login', { email: 'bad', password: 'bad' });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        return true;
      },
    );
  });
});
