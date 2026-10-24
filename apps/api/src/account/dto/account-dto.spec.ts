import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './index.js';

describe('Account DTO Validation', () => {
  describe('UpdateProfileDto', () => {
    it('should validate valid update profile payload', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        name: 'Jane Doe',
        phone: '+8801812345678',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if name is shorter than 2 characters', async () => {
      const dto = plainToInstance(UpdateProfileDto, {
        name: 'J',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });
  });

  describe('ChangePasswordDto', () => {
    it('should validate valid change password payload', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewSecurePassword123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when current password is missing', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        newPassword: 'NewSecurePassword123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when new password is too short or missing numbers', async () => {
      const shortDto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPassword123!',
        newPassword: 'short',
      });
      const errorsShort = await validate(shortDto);
      expect(errorsShort.length).toBeGreaterThan(0);

      const noNumberDto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPassword123!',
        newPassword: 'NoNumbersHereAtAll',
      });
      const errorsNoNumber = await validate(noNumberDto);
      expect(errorsNoNumber.length).toBeGreaterThan(0);
    });
  });

  describe('CreateAddressDto', () => {
    it('should validate complete valid address payload', async () => {
      const dto = plainToInstance(CreateAddressDto, {
        label: 'Home',
        recipientName: 'Jane Doe',
        phone: '+8801812345678',
        streetAddress: '123 Main Road, Banani',
        city: 'Dhaka',
        state: 'Dhaka Division',
        postalCode: '1213',
        country: 'Bangladesh',
        isDefaultShipping: true,
        isDefaultBilling: true,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when required fields are missing', async () => {
      const dto = plainToInstance(CreateAddressDto, {
        label: 'Home',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateAddressDto', () => {
    it('should validate partial address update', async () => {
      const dto = plainToInstance(UpdateAddressDto, {
        city: 'Chattogram',
        postalCode: '4000',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
