import { describe, it, expect } from 'vitest';
import { validate, DEV_PLACEHOLDER_SECRETS } from './env.validation.js';

describe('env.validation', () => {
  it('should accept minimal dev config in development mode', () => {
    const result = validate({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/az_ecommerce',
    });
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3001);
  });

  it('should reject missing or placeholder secrets in production mode', () => {
    expect(() =>
      validate({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/az_ecommerce',
        JWT_SECRET: DEV_PLACEHOLDER_SECRETS.JWT_SECRET,
        JWT_REFRESH_SECRET: DEV_PLACEHOLDER_SECRETS.JWT_REFRESH_SECRET,
      }),
    ).toThrow(/Production environment security error/);
  });

  it('should reject PayStation sandbox placeholder credentials in production mode', () => {
    expect(() =>
      validate({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/az_ecommerce',
        JWT_SECRET: 'super-strong-prod-access-secret-123456',
        JWT_REFRESH_SECRET: 'super-strong-prod-refresh-secret-654321',
        MOBIREACH_USERNAME: 'prod-sms-user',
        MOBIREACH_PASSWORD: 'prod-sms-strong-password',
        PAYSTATION_MERCHANT_ID: DEV_PLACEHOLDER_SECRETS.PAYSTATION_MERCHANT_ID,
      }),
    ).toThrow(/PayStation sandbox credentials are prohibited in production/);
  });

  it('should accept strong explicit secrets in production mode', () => {
    const result = validate({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/az_ecommerce',
      JWT_SECRET: 'super-strong-prod-access-secret-123456',
      JWT_REFRESH_SECRET: 'super-strong-prod-refresh-secret-654321',
      MOBIREACH_USERNAME: 'prod-sms-user',
      MOBIREACH_PASSWORD: 'prod-sms-strong-password',
      PAYSTATION_MERCHANT_ID: 'prod-merchant-999',
      PAYSTATION_PASSWORD: 'prod-paystation-password',
    });
    expect(result.NODE_ENV).toBe('production');
  });
});
