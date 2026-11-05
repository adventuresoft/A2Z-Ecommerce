import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException, NotFoundException } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service.js';
import { MarketplaceSort } from './dto/marketplace.dto.js';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let prismaMock: any;
  let settingsMock: any;
  let auditMock: any;

  beforeEach(() => {
    prismaMock = {
      freelancerProfile: { findMany: vi.fn(), findFirst: vi.fn() },
      contactReveal: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prismaMock)),
    };
    settingsMock = { getSettingValue: vi.fn().mockResolvedValue(20) };
    auditMock = { log: vi.fn() };
    service = new MarketplaceService(prismaMock, settingsMock, auditMock);
  });

  describe('buildWhere', () => {
    it('always applies the visibility predicate', () => {
      const where: any = service.buildWhere({});
      expect(where.AND[0]).toEqual({
        status: 'APPROVED',
        user: { isActive: true },
        locations: { some: {} },
        services: { some: {} },
      });
    });

    it('combines location filters on the same location row', () => {
      const where: any = service.buildWhere({
        districtId: 5,
        thanaId: 9,
        addressType: 'UNION' as any,
      });
      expect(where.AND).toContainEqual({
        locations: {
          some: { districtId: 5, thanaId: 9, unionId: { not: null } },
        },
      });
    });

    it('requires every requested skill', () => {
      const where: any = service.buildWhere({ skillIds: 's1, s2' });
      expect(where.AND).toContainEqual({ skills: { some: { skillId: 's1' } } });
      expect(where.AND).toContainEqual({ skills: { some: { skillId: 's2' } } });
    });

    it('ignores unknown availability values and applies experience, price and search', () => {
      const where: any = service.buildWhere({
        availability: 'AVAILABLE,BOGUS',
        minExperience: 2,
        maxPrice: 900,
        search: ' Karim ',
      });
      expect(where.AND).toContainEqual({ availability: { in: ['AVAILABLE'] } });
      expect(where.AND).toContainEqual({ experienceYears: { gte: 2 } });
      expect(where.AND).toContainEqual({ startingPrice: { lte: 900 } });
      expect(where.AND).toContainEqual({
        OR: [
          { displayName: { contains: 'Karim', mode: 'insensitive' } },
          { title: { contains: 'Karim', mode: 'insensitive' } },
        ],
      });
    });
  });

  describe('buildOrderBy', () => {
    it('defaults to available first, then last activity, then newest', () => {
      expect(service.buildOrderBy(MarketplaceSort.DEFAULT)).toEqual([
        { availability: 'asc' },
        { lastActiveAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'asc' },
      ]);
    });

    it('sorts price ascending with unpriced freelancers last', () => {
      expect(service.buildOrderBy(MarketplaceSort.PRICE_ASC)[0]).toEqual({
        startingPrice: { sort: 'asc', nulls: 'last' },
      });
    });
  });

  describe('listFreelancers cursor', () => {
    const row = (id: string) => ({
      id,
      displayName: id,
      services: [{ priceType: 'FIXED', amount: 500 }],
      locations: [],
      skills: [],
      _count: { skills: 0 },
    });

    it('returns a cursor when more rows exist and no cursor on the last page', async () => {
      prismaMock.freelancerProfile.findMany.mockResolvedValueOnce(
        [row('a'), row('b'), row('c')],
      );
      const first = await service.listFreelancers({ limit: 2 });
      expect(first.items.map((i: any) => i.id)).toEqual(['a', 'b']);
      expect(first.nextCursor).toBeTruthy();
      expect(prismaMock.freelancerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 3 }),
      );

      prismaMock.freelancerProfile.findMany.mockResolvedValueOnce([row('c')]);
      const second = await service.listFreelancers({
        limit: 2,
        cursor: first.nextCursor!,
      });
      expect(second.items.map((i: any) => i.id)).toEqual(['c']);
      expect(second.nextCursor).toBeNull();
      expect(prismaMock.freelancerProfile.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ skip: 2, take: 3 }),
      );
    });

    it('treats a malformed cursor as the first page', async () => {
      prismaMock.freelancerProfile.findMany.mockResolvedValue([]);
      await service.listFreelancers({ cursor: '%%%' });
      expect(prismaMock.freelancerProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });
  });

  describe('getProfile', () => {
    it('returns 404 for hidden freelancers', async () => {
      prismaMock.freelancerProfile.findFirst.mockResolvedValue(null);
      await expect(service.getProfile('x')).rejects.toBeInstanceOf(NotFoundException);
      const arg = prismaMock.freelancerProfile.findFirst.mock.calls[0][0];
      expect(JSON.stringify(arg.where)).toContain('APPROVED');
    });

    it('never selects phone, email or address', async () => {
      prismaMock.freelancerProfile.findFirst.mockResolvedValue({ id: 'p', skills: [] });
      await service.getProfile('p');
      const select = prismaMock.freelancerProfile.findFirst.mock.calls[0][0].select;
      expect(select.email).toBeUndefined();
      expect(select.address).toBeUndefined();
      expect(select.user).toBeUndefined();
    });
  });

  describe('revealPhone', () => {
    beforeEach(() => {
      prismaMock.freelancerProfile.findFirst.mockResolvedValue({
        id: 'f1',
        user: { phone: '+8801712345678' },
      });
    });

    it('creates a reveal and audit entry for a new freelancer', async () => {
      prismaMock.contactReveal.findFirst.mockResolvedValue(null);
      prismaMock.contactReveal.findMany.mockResolvedValue([{ freelancerId: 'x' }]);
      const res = await service.revealPhone('u1', 'f1');
      expect(res.phone).toBe('+8801712345678');
      expect(prismaMock.contactReveal.create).toHaveBeenCalledWith({
        data: { userId: 'u1', freelancerId: 'f1' },
      });
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CONTACT_REVEAL', entityId: 'f1' }),
      );
    });

    it('returns 429 once the daily distinct quota is used', async () => {
      prismaMock.contactReveal.findFirst.mockResolvedValue(null);
      prismaMock.contactReveal.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ freelancerId: `f${i}` })),
      );
      const err: any = await service.revealPhone('u1', 'f1').catch((e) => e);
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(429);
      expect(prismaMock.contactReveal.create).not.toHaveBeenCalled();
    });

    it('lets a known freelancer be revealed again without using quota', async () => {
      prismaMock.contactReveal.findFirst.mockResolvedValue({ id: 'r1' });
      const res = await service.revealPhone('u1', 'f1');
      expect(res.phone).toBe('+8801712345678');
      expect(prismaMock.contactReveal.create).not.toHaveBeenCalled();
      expect(auditMock.log).not.toHaveBeenCalled();
    });

    it('rejects hidden (for example suspended) freelancers as not found', async () => {
      prismaMock.freelancerProfile.findFirst.mockResolvedValue(null);
      await expect(service.revealPhone('u1', 'f1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('honours the admin configured limit', async () => {
      settingsMock.getSettingValue.mockResolvedValue(1);
      prismaMock.contactReveal.findFirst.mockResolvedValue(null);
      prismaMock.contactReveal.findMany.mockResolvedValue([{ freelancerId: 'x' }]);
      const err: any = await service.revealPhone('u1', 'f1').catch((e) => e);
      expect(err.getStatus()).toBe(429);
    });
  });

  describe('dhakaDayStart', () => {
    it('returns the previous 18:00 UTC for a time after Dhaka midnight', () => {
      const start = service.dhakaDayStart(new Date('2026-11-05T20:00:00Z'));
      expect(start.toISOString()).toBe('2026-11-05T18:00:00.000Z');
    });
  });
});

