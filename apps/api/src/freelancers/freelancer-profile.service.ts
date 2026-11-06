import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { LocationsValidationService } from '../locations/locations-validation.service.js';
import {
  UpdateProfileDto,
  UpdateAvailabilityDto,
  ManageLocationsDto,
  ManageServicesDto,
  ManageSkillsDto,
  ManagePortfolioDto,
  ServicePriceTypeEnum,
} from './dto/index.js';
import {
  FreelancerAvailability,
  FreelancerStatus,
  RevisionStatus,
  SkillStatus,
} from '@prisma/client';

@Injectable()
export class FreelancerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationsValidationService: LocationsValidationService,
  ) {}

  async getOrCreateProfile(userId: string) {
    try {
      return await this.getProfile(userId);
    } catch (err: any) {
      if (err instanceof NotFoundException) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        await this.prisma.freelancerProfile.create({
          data: {
            userId,
            displayName: user.name || 'Professional',
            status: FreelancerStatus.DRAFT,
          },
        });

        return this.getProfile(userId);
      }
      throw err;
    }
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
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
          orderBy: {
            isPrimary: 'desc',
          },
        },
        services: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        portfolio: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        revisions: {
          where: {
            status: RevisionStatus.PENDING,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Freelancer profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getProfile(userId);

    // If professionId is provided, verify it exists and is active
    if (dto.professionId) {
      const profession = await this.prisma.profession.findUnique({
        where: { id: dto.professionId },
      });
      if (!profession || !profession.isActive) {
        throw new BadRequestException('Selected profession does not exist or is inactive');
      }
    }

    const isSensitiveUpdate =
      dto.displayName !== undefined ||
      dto.nidNumber !== undefined ||
      dto.photoUrl !== undefined ||
      dto.professionId !== undefined ||
      dto.about !== undefined;

    // Two-track revision check: If approved, route sensitive fields to ProfileRevision
    if (profile.status === FreelancerStatus.APPROVED && isSensitiveUpdate) {
      const existingPendingRevision = await this.prisma.profileRevision.findFirst({
        where: {
          freelancerId: profile.id,
          status: RevisionStatus.PENDING,
        },
      });

      const currentPayload = (existingPendingRevision?.payload as Record<string, unknown>) || {};
      const sensitivePayload: Record<string, unknown> = {
        ...currentPayload,
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.nidNumber !== undefined ? { nidNumber: dto.nidNumber } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.professionId !== undefined ? { professionId: dto.professionId } : {}),
        ...(dto.about !== undefined ? { about: dto.about } : {}),
      };

      if (existingPendingRevision) {
        await this.prisma.profileRevision.update({
          where: { id: existingPendingRevision.id },
          data: { payload: sensitivePayload as any },
        });
      } else {
        await this.prisma.profileRevision.create({
          data: {
            freelancerId: profile.id,
            payload: sensitivePayload as any,
            status: RevisionStatus.PENDING,
          },
        });
      }

      // Update remaining non-sensitive fields directly on live profile
      const nonSensitiveData: Record<string, unknown> = {};
      if (dto.title !== undefined) nonSensitiveData.title = dto.title;
      if (dto.experienceYears !== undefined) nonSensitiveData.experienceYears = dto.experienceYears;
      if (dto.email !== undefined) nonSensitiveData.email = dto.email;
      if (dto.address !== undefined) nonSensitiveData.address = dto.address;

      if (Object.keys(nonSensitiveData).length > 0) {
        await this.prisma.freelancerProfile.update({
          where: { id: profile.id },
          data: nonSensitiveData,
        });
      }

      return {
        message: 'Sensitive changes submitted for administrative review',
        isRevisionPending: true,
      };
    }

    // Direct update for DRAFT, REJECTED, or non-sensitive fields
    const updated = await this.prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.nidNumber !== undefined ? { nidNumber: dto.nidNumber } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.professionId !== undefined ? { professionId: dto.professionId } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.about !== undefined ? { about: dto.about } : {}),
        ...(dto.experienceYears !== undefined ? { experienceYears: dto.experienceYears } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
      },
    });

    return {
      message: 'Profile updated successfully',
      profile: updated,
    };
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const profile = await this.getProfile(userId);

    const updated = await this.prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        availability: dto.availability as FreelancerAvailability,
      },
    });

    return {
      message: 'Availability updated successfully',
      availability: updated.availability,
    };
  }

  async manageLocations(userId: string, dto: ManageLocationsDto) {
    const profile = await this.getProfile(userId);

    if (!dto.locations || dto.locations.length < 1 || dto.locations.length > 5) {
      throw new BadRequestException('You must provide between 1 and 5 locations');
    }

    const primaryCount = dto.locations.filter((l) => l.isPrimary).length;
    if (primaryCount !== 1) {
      throw new BadRequestException('Exactly one location must be designated as primary');
    }

    // Validate location hierarchies
    for (const loc of dto.locations) {
      await this.locationsValidationService.validateLocationSelection(loc);
    }

    // Save locations in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.freelancerLocation.deleteMany({
        where: { freelancerId: profile.id },
      });

      await tx.freelancerLocation.createMany({
        data: dto.locations.map((loc) => ({
          freelancerId: profile.id,
          divisionId: loc.divisionId,
          districtId: loc.districtId,
          thanaId: loc.thanaId,
          postOfficeId: loc.postOfficeId,
          cityCorporationId: loc.cityCorporationId || null,
          wardId: loc.wardId || null,
          paurashavaId: loc.paurashavaId || null,
          unionId: loc.unionId || null,
          localityText: loc.localityText || null,
          isPrimary: loc.isPrimary,
        })),
      });
    });

    return {
      message: 'Locations updated successfully',
    };
  }

  async manageServices(userId: string, dto: ManageServicesDto) {
    const profile = await this.getProfile(userId);

    if (!dto.services || dto.services.length < 1 || dto.services.length > 10) {
      throw new BadRequestException('You must offer between 1 and 10 services');
    }

    for (const s of dto.services) {
      if (s.priceType !== ServicePriceTypeEnum.NEGOTIABLE && (s.amount === undefined || s.amount === null)) {
        throw new BadRequestException(`Price amount is required for non-negotiable service: "${s.title}"`);
      }
    }

    // Calculate starting price: minimum non-null amount among non-negotiable services
    const numericAmounts = dto.services
      .filter((s) => s.priceType !== ServicePriceTypeEnum.NEGOTIABLE && s.amount !== undefined && s.amount !== null)
      .map((s) => s.amount as number);

    const startingPrice = numericAmounts.length > 0 ? Math.min(...numericAmounts) : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.freelancerService.deleteMany({
        where: { freelancerId: profile.id },
      });

      await tx.freelancerService.createMany({
        data: dto.services.map((s) => ({
          freelancerId: profile.id,
          title: s.title,
          description: s.description || null,
          priceType: s.priceType,
          amount: s.priceType === ServicePriceTypeEnum.NEGOTIABLE ? null : s.amount,
        })),
      });

      await tx.freelancerProfile.update({
        where: { id: profile.id },
        data: { startingPrice },
      });
    });

    return {
      message: 'Services updated successfully',
      startingPrice,
    };
  }

  async manageSkills(userId: string, dto: ManageSkillsDto) {
    const profile = await this.getProfile(userId);

    if (!profile.professionId) {
      throw new BadRequestException('Please set your profession before selecting skills');
    }

    if (!dto.skillIds || dto.skillIds.length > 10) {
      throw new BadRequestException('A maximum of 10 skills can be selected');
    }

    // Verify all skills are active and belong to freelancer's profession
    if (dto.skillIds.length > 0) {
      const skills = await this.prisma.skill.findMany({
        where: {
          id: { in: dto.skillIds },
          professionId: profile.professionId,
          status: SkillStatus.ACTIVE,
        },
      });

      if (skills.length !== dto.skillIds.length) {
        throw new BadRequestException(
          'One or more selected skills are invalid, inactive, or do not belong to your profession',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.freelancerSkill.deleteMany({
        where: { freelancerId: profile.id },
      });

      if (dto.skillIds.length > 0) {
        await tx.freelancerSkill.createMany({
          data: dto.skillIds.map((skillId) => ({
            freelancerId: profile.id,
            skillId,
          })),
        });
      }
    });

    return {
      message: 'Skills updated successfully',
      skillCount: dto.skillIds.length,
    };
  }

  async managePortfolio(userId: string, dto: ManagePortfolioDto) {
    const profile = await this.getProfile(userId);

    if (!dto.items || dto.items.length > 10) {
      throw new BadRequestException('A maximum of 10 portfolio items can be added');
    }

    // Two-track revision check: If approved, route portfolio edits to ProfileRevision
    if (profile.status === FreelancerStatus.APPROVED) {
      const existingPendingRevision = await this.prisma.profileRevision.findFirst({
        where: {
          freelancerId: profile.id,
          status: RevisionStatus.PENDING,
        },
      });

      const currentPayload = (existingPendingRevision?.payload as Record<string, unknown>) || {};
      const sensitivePayload = {
        ...currentPayload,
        portfolio: dto.items,
      };

      if (existingPendingRevision) {
        await this.prisma.profileRevision.update({
          where: { id: existingPendingRevision.id },
          data: { payload: sensitivePayload as any },
        });
      } else {
        await this.prisma.profileRevision.create({
          data: {
            freelancerId: profile.id,
            payload: sensitivePayload as any,
            status: RevisionStatus.PENDING,
          },
        });
      }

      return {
        message: 'Portfolio updates submitted for administrative review',
        isRevisionPending: true,
      };
    }

    // Direct update for DRAFT or REJECTED
    await this.prisma.$transaction(async (tx) => {
      await tx.portfolioItem.deleteMany({
        where: { freelancerId: profile.id },
      });

      if (dto.items.length > 0) {
        await tx.portfolioItem.createMany({
          data: dto.items.map((item, idx) => ({
            freelancerId: profile.id,
            imageUrl: item.imageUrl,
            caption: item.caption || null,
            sortOrder: item.sortOrder ?? idx,
          })),
        });
      }
    });

    return {
      message: 'Portfolio updated successfully',
      itemCount: dto.items.length,
    };
  }

  async submitProfile(userId: string) {
    const profile = await this.getProfile(userId);

    if (
      profile.status !== FreelancerStatus.DRAFT &&
      profile.status !== FreelancerStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Profile cannot be submitted from status ${profile.status}`,
      );
    }

    const missingFields: string[] = [];
    if (!profile.displayName || profile.displayName.trim().length === 0) {
      missingFields.push('displayName');
    }
    if (!profile.nidNumber || profile.nidNumber.trim().length === 0) {
      missingFields.push('nidNumber');
    }
    if (!profile.professionId) {
      missingFields.push('profession');
    }
    if (!profile.locations || profile.locations.length === 0) {
      missingFields.push('locations (at least 1 required)');
    }
    if (!profile.services || profile.services.length === 0) {
      missingFields.push('services (at least 1 required)');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Please complete the required profile sections before submission: ${missingFields.join(', ')}`,
      );
    }

    const updated = await this.prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        status: FreelancerStatus.PENDING,
      },
    });

    return {
      success: true,
      message: 'Profile submitted successfully for administrative review',
      status: updated.status,
    };
  }

  /**
   * List clients who viewed/revealed this freelancer's phone number
   */
  async getReveals(userId: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Freelancer profile not found');
    }

    const reveals = await this.prisma.contactReveal.findMany({
      where: { freelancerId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return reveals.map((r) => ({
      id: r.id,
      revealedAt: r.createdAt,
      client: {
        id: r.user.id,
        name: r.user.name,
      },
    }));
  }
}

