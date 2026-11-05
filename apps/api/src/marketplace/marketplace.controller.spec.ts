import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { MarketplaceController } from './marketplace.controller.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MembershipGuard } from '../memberships/guards/membership.guard.js';

describe('MarketplaceController guards', () => {
  it('requires authentication for every route (401 without a token)', () => {
    const guards = Reflect.getMetadata('__guards__', MarketplaceController);
    expect(guards).toContain(JwtAuthGuard);
  });

  it('requires an active membership for reveal-phone only', () => {
    const reveal = Reflect.getMetadata(
      '__guards__',
      MarketplaceController.prototype.revealPhone,
    );
    const list = Reflect.getMetadata('__guards__', MarketplaceController.prototype.list);
    expect(reveal).toContain(MembershipGuard);
    expect(list).toBeUndefined();
  });
});

