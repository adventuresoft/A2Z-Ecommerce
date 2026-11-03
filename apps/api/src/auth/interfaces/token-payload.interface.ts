import type { Role } from '@prisma/client';

export interface AccessPayload {
  sub: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
}

export interface RefreshPayload {
  sub: string;
  tokenVersion: number;
}

export interface VerificationTokenPayload {
  phone: string;
  purpose: 'SIGNUP' | 'RESET_PASSWORD';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
