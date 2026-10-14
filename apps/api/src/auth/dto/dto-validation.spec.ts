import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto, RefreshTokenDto } from './index.js';

describe('Auth DTO Validation', () => {
  it('should pass RegisterDto when payload is valid', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'customer@az.local',
      password: 'StrongPassword123!',
      name: 'Customer Name',
      phone: '+8801700000000',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail RegisterDto when email is invalid or password is too short', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'not-an-email',
      password: 'short',
      name: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('email');
    expect(properties).toContain('password');
    expect(properties).toContain('name');
  });

  it('should pass LoginDto with valid email and password', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'admin@az.local',
      password: 'AdminPassword123!',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail LoginDto with empty fields', async () => {
    const dto = plainToInstance(LoginDto, {
      email: '',
      password: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate RefreshTokenDto requirement', async () => {
    const validDto = plainToInstance(RefreshTokenDto, { refreshToken: 'jwt.token.here' });
    expect((await validate(validDto)).length).toBe(0);

    const invalidDto = plainToInstance(RefreshTokenDto, { refreshToken: '' });
    expect((await validate(invalidDto)).length).toBeGreaterThan(0);
  });
});
