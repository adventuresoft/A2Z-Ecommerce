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
  });

  it('should throw an error if DATABASE_URL is missing', () => {
    const config = {
      PORT: 3001,
    };
    expect(() => validate(config)).toThrow(/DATABASE_URL/);
  });
});
