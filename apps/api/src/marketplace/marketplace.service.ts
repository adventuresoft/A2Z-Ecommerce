import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, FreelancerAvailability, FreelancerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  MarketplaceAddressType,
  MarketplaceListQueryDto,
  MarketplaceSort,
} from './dto/marketplace.dto.js';

export const REVEAL_LIMIT_SETTING = 'marketplace.revealDailyLimit';
export const DEFAULT_REVEAL_LIMIT = 20;
const DEFAULT_PAGE_SIZE = 20;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

const locationInclude = {
  division: { select: { id: true, name: true, bnName: true } },
  district: { select: { id: true, name: true, bnName: true } },
  thana: { select: { id: true, name: true, bnName: true } },
} satisfies Prisma.FreelancerLocationInclude;

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly audit: AuditLogsService,
  ) {}

  /** Only approved, active, complete freelancers are ever visible. */
  private visibleWhere(): Prisma.FreelancerProfileWhereInput {
    return {
      status: FreelancerStatus.APPROVED,
      user: { isActive: true },
      locations: { some: {} },
      services: { some: {} },
    };
  }

  private csv(value?: string): string[] {
    return (value ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  buildWhere(query: MarketplaceListQueryDto): Prisma.FreelancerProfileWhereInput {
    const and: Prisma.FreelancerProfileWhereInput[] = [this.visibleWhere()];

    if (query.professionId) {
      and.push({ professionId: query.professionId });
    }
    if (query.categoryId) {
      and.push({ profession: { categoryId: query.categoryId } });
    }

    for (const skillId of this.csv(query.skillIds)) {
      and.push({ skills: { some: { skillId } } });
    }

    if (query.minExperience !== undefined || query.maxExperience !== undefined) {
      and.push({
        experienceYears: {
          ...(query.minExperience !== undefined && { gte: query.minExperience }),
          ...(query.maxExperience !== undefined && { lte: query.maxExperience }),
        },
      });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      and.push({
        startingPrice: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
        },
      });
    }

    const location: Prisma.FreelancerLocationWhereInput = {};
    if (query.divisionId) location.divisionId = query.divisionId;
    if (query.districtId) location.districtId = query.districtId;
    if (query.thanaId) location.thanaId = query.thanaId;
    if (query.addressType === MarketplaceAddressType.CITY_CORPORATION) {
      location.cityCorporationId = { not: null };
    } else if (query.addressType === MarketplaceAddressType.PAURASHAVA) {
      location.paurashavaId = { not: null };
    } else if (query.addressType === MarketplaceAddressType.UNION) {
      location.unionId = { not: null };
    }
    if (Object.keys(location).length > 0) {
      and.push({ locations: { some: location } });
    }

    const availability = this.csv(query.availability).filter(
      (v): v is FreelancerAvailability =>
        (Object.values(FreelancerAvailability) as string[]).includes(v),
    );
    if (availability.length > 0) {
      and.push({ availability: { in: availability } });
    }

    const term = query.search?.trim();
    if (term) {
      and.push({
        OR: [
          { displayName: { contains: term, mode: 'insensitive' } },
          { title: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: and };
  }

  buildOrderBy(sort?: MarketplaceSort): Prisma.FreelancerProfileOrderByWithRelationInput[] {
    switch (sort) {
      case MarketplaceSort.PRICE_ASC:
        return [
          { startingPrice: { sort: 'asc', nulls: 'last' } },
          { availability: 'asc' },
          { id: 'asc' },
        ];
      case MarketplaceSort.PRICE_DESC:
        return [
          { startingPrice: { sort: 'desc', nulls: 'last' } },
          { availability: 'asc' },
          { id: 'asc' },
        ];
      case MarketplaceSort.EXPERIENCE:
        return [
          { experienceYears: 'desc' },
          { availability: 'asc' },
          { id: 'asc' },
        ];
      default:
        // Enum declaration order is AVAILABLE, BUSY, UNAVAILABLE.
        return [
          { availability: 'asc' },
          { lastActiveAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'asc' },
        ];
    }
  }

  private encodeCursor(offset: number): string {
    return Buffer.from(JSON.stringify({ o: offset })).toString('base64url');
  }

  private decodeCursor(cursor?: string): number {
    if (!cursor) return 0;
    try {
      const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      const offset = Number(parsed?.o);
      return Number.isInteger(offset) && offset >= 0 ? offset : 0;
    } catch {
      return 0;
    }
  }

  async listFreelancers(query: MarketplaceListQueryDto) {
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const offset = this.decodeCursor(query.cursor);
    const where = this.buildWhere(query);

    const rows = await this.prisma.freelancerProfile.findMany({
      where,
      orderBy: this.buildOrderBy(query.sort),
      skip: offset,
      take: limit + 1,
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        title: true,
        experienceYears: true,
        availability: true,
        startingPrice: true,
        profession: { select: { id: true, name: true, bnName: true } },
        skills: {
          take: 3,
          select: { skill: { select: { id: true, name: true, bnName: true } } },
        },
        _count: { select: { skills: true } },
        services: { select: { priceType: true, amount: true } },
        locations: {
          orderBy: { isPrimary: 'desc' },
          take: 1,
          include: locationInclude,
        },
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const items = page.map(({ services, locations, skills, _count, ...rest }) => {
      const priced = services
        .filter((s) => s.amount !== null)
        .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))[0];
      return {
        ...rest,
        skills: skills.map((s) => s.skill),
        extraSkillCount: Math.max(0, _count.skills - skills.length),
        startingPriceType: priced?.priceType ?? null,
        primaryLocation: locations[0] ?? null,
      };
    });

    return {
      items,
      nextCursor: hasMore ? this.encodeCursor(offset + limit) : null,
    };
  }

  async getProfile(id: string) {
    const profile = await this.prisma.freelancerProfile.findFirst({
      where: { AND: [{ id }, this.visibleWhere()] },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        title: true,
        about: true,
        experienceYears: true,
        availability: true,
        startingPrice: true,
        lastActiveAt: true,
        approvedAt: true,
        profession: {
          select: {
            id: true,
            name: true,
            bnName: true,
            category: { select: { id: true, name: true, bnName: true } },
          },
        },
        skills: {
          select: { skill: { select: { id: true, name: true, bnName: true } } },
        },
        services: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            priceType: true,
            amount: true,
          },
        },
        portfolio: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, imageUrl: true, caption: true },
        },
        locations: {
          orderBy: { isPrimary: 'desc' },
          select: {
            id: true,
            isPrimary: true,
            localityText: true,
            ...locationInclude,
            cityCorporation: { select: { id: true, name: true, bnName: true } },
            ward: { select: { id: true, wardNo: true, name: true, bnName: true } },
            paurashava: { select: { id: true, name: true, bnName: true } },
            union: { select: { id: true, name: true, bnName: true } },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Freelancer not found');
    }

    const { skills, ...rest } = profile;
    return { ...rest, skills: skills.map((s) => s.skill) };
  }

  /** Start of the current day in Asia/Dhaka (UTC+6, no DST), as a UTC instant. */
  dhakaDayStart(now: Date = new Date()): Date {
    const shifted = new Date(now.getTime() + DHAKA_OFFSET_MS);
    shifted.setUTCHours(0, 0, 0, 0);
    return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
  }

  async revealPhone(userId: string, freelancerId: string, meta?: { ip?: string; userAgent?: string }) {
    const freelancer = await this.prisma.freelancerProfile.findFirst({
      where: { AND: [{ id: freelancerId }, this.visibleWhere()] },
      select: { id: true, user: { select: { phone: true } } },
    });
    if (!freelancer || !freelancer.user.phone) {
      throw new NotFoundException('Freelancer not found');
    }
    const phone = freelancer.user.phone;

    const limit = await this.settings.getSettingValue<number>(
      REVEAL_LIMIT_SETTING,
      DEFAULT_REVEAL_LIMIT,
    );
    const dayStart = this.dhakaDayStart();

    const created = await this.prisma.$transaction(async (tx) => {
      const already = await tx.contactReveal.findFirst({
        where: { userId, freelancerId },
        select: { id: true },
      });
      if (already) return false;

      const today = await tx.contactReveal.findMany({
        where: { userId, createdAt: { gte: dayStart } },
        distinct: ['freelancerId'],
        select: { freelancerId: true },
      });
      if (today.length >= limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Daily limit of ${limit} phone numbers reached. It resets at midnight (Asia/Dhaka).`,
            code: 'REVEAL_QUOTA_EXCEEDED',
            resetsAt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await tx.contactReveal.create({ data: { userId, freelancerId } });
      return true;
    });

    if (created) {
      await this.audit.log({
        userId,
        action: 'CONTACT_REVEAL',
        entityType: 'FreelancerProfile',
        entityId: freelancerId,
        ipAddress: meta?.ip ?? null,
        userAgent: meta?.userAgent?.slice(0, 255) ?? null,
      });
    }

    return { phone };
  }
}

