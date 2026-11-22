import { z } from 'zod';
import { isValidBdPhone } from '@/shared/utils/bd-phone';

export const phoneStepSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid Bangladesh mobile number')
    .refine(isValidBdPhone, 'Must be a valid 11-digit BD mobile number (01XXXXXXXXX)'),
});

export const phoneLoginSchema = z.object({
  phone: z.string().refine(isValidBdPhone, 'Invalid mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const emailLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const otpVerifySchema = z.object({
  code: z.string().regex(/^\d{4}$/, 'Enter the 4-digit OTP code'),
});

export const phoneRegisterSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, 'Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm your new password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
