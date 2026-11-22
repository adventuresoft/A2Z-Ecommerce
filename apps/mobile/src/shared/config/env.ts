import { z } from 'zod';

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  API_URL: z.string().url().default('http://10.0.2.2:3001/api/v1'),
  WEB_URL: z.string().url().default('http://10.0.2.2:3000'),
  SENTRY_DSN: z.string().optional().default(''),
  POSTHOG_KEY: z.string().optional().default(''),
  POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),
});

export type AppEnvironmentConfig = z.infer<typeof envSchema> & {
  API_ORIGIN: string;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
};

export function parseAppEnv(source: Record<string, string | undefined> = process.env): AppEnvironmentConfig {
  const parsed = envSchema.parse({
    APP_ENV: source.EXPO_PUBLIC_APP_ENV || source.APP_ENV || 'development',
    API_URL: source.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api/v1',
    WEB_URL: source.EXPO_PUBLIC_WEB_URL || 'http://10.0.2.2:3000',
    SENTRY_DSN: source.EXPO_PUBLIC_SENTRY_DSN || '',
    POSTHOG_KEY: source.EXPO_PUBLIC_POSTHOG_KEY || '',
    POSTHOG_HOST: source.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  });

  const apiOrigin = parsed.API_URL.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');

  return {
    ...parsed,
    API_ORIGIN: apiOrigin,
    isProduction: parsed.APP_ENV === 'production',
    isStaging: parsed.APP_ENV === 'staging',
    isDevelopment: parsed.APP_ENV === 'development',
  };
}

export const env: AppEnvironmentConfig = parseAppEnv();
