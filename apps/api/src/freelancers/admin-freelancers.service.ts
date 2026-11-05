import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AdminFreelancerQueryDto,
  AdminRevisionQueryDto,
  RejectFreelancerDto,
  RejectRevisionDto,
  SuspendFreelancerDto,
} from './dto/freelancer-admin.dto.js';
import { FreelancerStatus, RevisionStatus } from '@prisma/client';

@Injectable()
export class AdminFreelancersService {
  constructor(private readonly prisma: PrismaService) {}

  async listFreelancers(query: AdminFreelancerQueryDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.professionId) {
      where.professionId = query.professionId;
    }

    if (query.search && query.search.trim().length > 0) {
      const term = query.search.trim();
      where.OR = [
        { displayName: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { user: { phone: { contains: term } } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.freelancerProfile.count({ where }),
      this.prisma.freelancerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          profession: true,
          locations: {
            where: { isPrimary: true },
            include: {
              division: true,
              district: true,
              thana: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
    ]);

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getFreelancerById(id: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        profession: {
          include: {
            category: true,
          },
        },
        locations: {
          include: {
            division: true,
            district: true,
            thana: true,
            postOffice: true,
            cityCorporation: true,
            ward: true,
            paurashava: true,
            union: true,
          },
        },
        services: true,
        skills: {
          include: {
            skill: true,
          },
        },
        portfolio: {
          orderBy: { sortOrder: 'asc' },
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Freelancer profile with ID ${id} not found`);
    }

    return profile;
  }

  async approveFreelancer(id: string, adminUserId: string) {
    const profile = await this.getFreelancerById(id);

    const updated = await this.prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        status: FreelancerStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: adminUserId,
        rejectionReason: null,
      },
    });

    return {
      message: 'Freelancer profile approved successfully',
      profile: updated,
    };
  }

  async rejectFreelancer(id: string, dto: RejectFreelancerDto) {
    const profile = await this.getFreelancerById(id);

    const newRejectionCount = profile.rejectionCount + 1;
    const flaggedForAudit = newRejectionCount >= 3;

    const updated = await this.prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        status: FreelancerStatus.REJECTED,
        rejectionReason: dto.reason,
        rejectionCount: {
          increment: 1,
        },
      },
    });

    return {
      message: 'Freelancer profile rejected',
      rejectionReason: dto.reason,
      rejectionCount: newRejectionCount,
      flaggedForAudit,
      profile: updated,
    };
  }

  async suspendFreelancer(id: string, dto: SuspendFreelancerDto) {
    const profile = await this.getFreelancerById(id);

    const updated = await this.prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        status: FreelancerStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendReason: dto.reason,
      },
    });

    return {
      message: 'Freelancer profile suspended',
      profile: updated,
    };
  }

  async reinstateFreelancer(id: string) {
    const profile = await this.getFreelancerById(id);

    const updated = await this.prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        status: FreelancerStatus.APPROVED,
        suspendedAt: null,
        suspendReason: null,
      },
    });

    return {
      message: 'Freelancer profile reinstated successfully',
      profile: updated,
    };
  }

  async listRevisions(query: AdminRevisionQueryDto) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.freelancerId) {
      where.freelancerId = query.freelancerId;
    }

    const [total, items] = await Promise.all([
      this.prisma.profileRevision.count({ where }),
      this.prisma.profileRevision.findMany({
        where,
        include: {
          freelancer: {
            select: {
              id: true,
              displayName: true,
              title: true,
              photoUrl: true,
              status: true,
              profession: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
    ]);

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async approveRevision(revisionId: string, adminUserId: string) {
    const revision = await this.prisma.profileRevision.findUnique({
      where: { id: revisionId },
      include: { freelancer: true },
    });

    if (!revision) {
      throw new NotFoundException(`Revision with ID ${revisionId} not found`);
    }

    if (revision.status !== RevisionStatus.PENDING) {
      throw new BadRequestException(
        `Revision cannot be approved from status ${revision.status}`,
      );
    }

    const payload = (revision.payload as Record<string, any>) || {};

    await this.prisma.$transaction(async (tx) => {
      // 1. Update FreelancerProfile fields if in payload
      const profileUpdates: Record<string, any> = {};
      if (payload.displayName) profileUpdates.displayName = payload.displayName;
      if (payload.photoUrl) profileUpdates.photoUrl = payload.photoUrl;
      if (payload.professionId) profileUpdates.professionId = payload.professionId;
      if (payload.about) profileUpdates.about = payload.about;

      if (Object.keys(profileUpdates).length > 0) {
        await tx.freelancerProfile.update({
          where: { id: revision.freelancerId },
          data: profileUpdates,
        });
      }

      // 2. Update portfolio items if in payload
      if (Array.isArray(payload.portfolio)) {
        await tx.portfolioItem.deleteMany({
          where: { freelancerId: revision.freelancerId },
        });

        if (payload.portfolio.length > 0) {
          await tx.portfolioItem.createMany({
            data: payload.portfolio.map((item: any, idx: number) => ({
              freelancerId: revision.freelancerId,
              imageUrl: item.imageUrl,
              caption: item.caption || null,
              sortOrder: item.sortOrder ?? idx,
            })),
          });
        }
      }

      // 3. Mark revision APPROVED
      await tx.profileRevision.update({
        where: { id: revision.id },
        data: {
          status: RevisionStatus.APPROVED,
          reviewedById: adminUserId,
        },
      });
    });

    return {
      message: 'Profile revision approved and live profile updated',
    };
  }

  async rejectRevision(
    revisionId: string,
    dto: RejectRevisionDto,
    adminUserId: string,
  ) {
    const revision = await this.prisma.profileRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) {
      throw new NotFoundException(`Revision with ID ${revisionId} not found`);
    }

    if (revision.status !== RevisionStatus.PENDING) {
      throw new BadRequestException(
        `Revision cannot be rejected from status ${revision.status}`,
      );
    }

    const updated = await this.prisma.profileRevision.update({
      where: { id: revision.id },
      data: {
        status: RevisionStatus.REJECTED,
        reason: dto.reason,
        reviewedById: adminUserId,
      },
    });

    return {
      message: 'Profile revision rejected',
      revision: updated,
    };
  }
}

