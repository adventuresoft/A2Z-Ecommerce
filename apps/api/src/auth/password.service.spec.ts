import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should hash a password and verify successfully', async () => {
    const raw = 'SecurePassword123!';
    const hash = await service.hash(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(raw);
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isValid = await service.verify(hash, raw);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await service.hash('Password123!');
    const isValid = await service.verify(hash, 'WrongPassword!');
    expect(isValid).toBe(false);
  });

  it('should return false for malformed hash', async () => {
    const isValid = await service.verify('invalid-hash-string', 'Password123!');
    expect(isValid).toBe(false);
  });
});
