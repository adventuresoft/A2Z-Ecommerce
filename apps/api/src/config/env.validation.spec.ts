import { describe, expect, it } from 'vitest';
import { validate } from './env.validation.js';

describe('Environment Validation', () => {
  it('should validate valid environment configuration', () => {
    const config = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ecommerce_db',
      PORT: '3001',
      NODE_ENV: 'development',
    };
    const result = validate(config);
    expect(result.PORT).toBe(3001);
    expect(result.DATABASE_URL).toBe(config.DATABASE_URL);
    expect(result.JWT_SECRET).toBe('dev-insecure-access-secret-change-in-production');
    expect(result.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(result.JWT_REFRESH_SECRET).toBe('dev-insecure-refresh-secret-change-in-production');
    expect(result.JWT_REFRESH_EXPIRES_IN).toBe('7d');
  });

  it('should throw an error if DATABASE_URL is missing', () => {
    const config = {
      PORT: 3001,
    };
    expect(() => validate(config)).toThrow(/DATABASE_URL/);
  });
});
