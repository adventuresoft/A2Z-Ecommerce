import { parseAppEnv } from './env';

describe('parseAppEnv', () => {
  it('defaults safely to development env and strips /api/v1 for API_ORIGIN', () => {
    const cfg = parseAppEnv({});
    expect(cfg.APP_ENV).toBe('development');
    expect(cfg.isDevelopment).toBe(true);
    expect(cfg.API_ORIGIN).toBe('http://10.0.2.2:3001');
  });

  it('parses production env cleanly', () => {
    const cfg = parseAppEnv({
      EXPO_PUBLIC_APP_ENV: 'production',
      EXPO_PUBLIC_API_URL: 'https://api.atozecommerce.com/api/v1',
      EXPO_PUBLIC_WEB_URL: 'https://atozecommerce.com',
    });
    expect(cfg.isProduction).toBe(true);
    expect(cfg.API_ORIGIN).toBe('https://api.atozecommerce.com');
  });

  it('rejects malformed URLs via Zod', () => {
    expect(() =>
      parseAppEnv({
        EXPO_PUBLIC_API_URL: 'not-a-valid-url',
      }),
    ).toThrow();
  });
});
