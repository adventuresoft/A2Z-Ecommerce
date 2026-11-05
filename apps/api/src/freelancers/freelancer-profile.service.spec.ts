import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FreelancerProfileService } from './freelancer-profile.service.js';
import { FreelancerStatus, RevisionStatus, FreelancerAvailability, ServicePriceType } from '@prisma/client';
import { ServicePriceTypeEnum } from './dto/index.js';

describe('FreelancerProfileService', () => {
  let service: FreelancerProfileService;
  let prismaMock: any;
  let locationValidationMock: any;

  beforeEach(() => {
    prismaMock = {
      freelancerProfile: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      profession: {
        findUnique: vi.fn(),
      },
      skill: {
        findMany: vi.fn(),
      },
      profileRevision: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      freelancerLocation: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      freelancerService: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      freelancerSkill: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      portfolioItem: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prismaMock)),
    };

    locationValidationMock = {
      validateLocationSelection: vi.fn().mockResolvedValue(true),
    };

    service = new FreelancerProfileService(prismaMock, locationValidationMock);
  });

  describe('getProfile', () => {
    it('should throw NotFoundException if profile does not exist', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return profile with relations', async () => {
      const mockProfile = {
        id: 'prof-1',
        userId: 'user-1',
        displayName: 'Karim',
        status: FreelancerStatus.DRAFT,
      };
      prismaMock.freelancerProfile.findUnique.mockResolvedValue(mockProfile);

      const res = await service.getProfile('user-1');
      expect(res).toEqual(mockProfile);
    });
  });

  describe('updateProfile (Two-track revisions)', () => {
    it('should update draft profile directly', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
        status: FreelancerStatus.DRAFT,
      });
      prismaMock.freelancerProfile.update.mockResolvedValue({
        id: 'prof-1',
        displayName: 'New Name',
      });

      const res = await service.updateProfile('user-1', {
        displayName: 'New Name',
      });

      expect(res.profile.displayName).toBe('New Name');
      expect(prismaMock.profileRevision.create).not.toHaveBeenCalled();
    });

    it('should route sensitive field changes on APPROVED profile to ProfileRevision', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
        status: FreelancerStatus.APPROVED,
        displayName: 'Old Name',
      });
      prismaMock.profileRevision.findFirst.mockResolvedValue(null);

      const res = await service.updateProfile('user-1', {
        displayName: 'Sensitive Name Change',
      });

      expect(res.isRevisionPending).toBe(true);
      expect(prismaMock.profileRevision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          freelancerId: 'prof-1',
          payload: { displayName: 'Sensitive Name Change' },
          status: RevisionStatus.PENDING,
        }),
      });
    });

    it('should update non-sensitive fields directly even when profile is APPROVED', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
        status: FreelancerStatus.APPROVED,
        title: 'Old Title',
      });

      await service.updateProfile('user-1', {
        title: 'Master Electrician',
        experienceYears: 8,
      });

      expect(prismaMock.profileRevision.create).not.toHaveBeenCalled();
      expect(prismaMock.freelancerProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: {
          title: 'Master Electrician',
          experienceYears: 8,
        },
      });
    });
  });

  describe('manageLocations', () => {
    it('should throw BadRequestException if no primary location is set', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
      });

      await expect(
        service.manageLocations('user-1', {
          locations: [
            {
              divisionId: 1,
              districtId: 2,
              thanaId: 3,
              postOfficeId: 4,
              isPrimary: false,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save valid locations when exactly one primary is specified', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
      });

      const res = await service.manageLocations('user-1', {
        locations: [
          {
            divisionId: 1,
            districtId: 2,
            thanaId: 3,
            postOfficeId: 4,
            isPrimary: true,
          },
        ],
      });

      expect(locationValidationMock.validateLocationSelection).toHaveBeenCalled();
      expect(prismaMock.freelancerLocation.createMany).toHaveBeenCalled();
      expect(res.message).toContain('Locations updated successfully');
    });
  });

  describe('manageServices & startingPrice', () => {
    it('should calculate startingPrice as the minimum non-negotiable amount', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
      });

      const res = await service.manageServices('user-1', {
        services: [
          {
            title: 'Full wiring',
            priceType: ServicePriceTypeEnum.FIXED,
            amount: 2500,
          },
          {
            title: 'Switch repair',
            priceType: ServicePriceTypeEnum.FIXED,
            amount: 300,
          },
          {
            title: 'Consultation',
            priceType: ServicePriceTypeEnum.NEGOTIABLE,
          },
        ],
      });

      expect(res.startingPrice).toBe(300);
      expect(prismaMock.freelancerProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: { startingPrice: 300 },
      });
    });
  });

  describe('submitProfile', () => {
    it('should reject submission if required sections are missing', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
        status: FreelancerStatus.DRAFT,
        displayName: 'Karim',
        professionId: null, // missing profession
        locations: [],
        services: [],
      });

      await expect(service.submitProfile('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should submit complete profile to PENDING status', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
        status: FreelancerStatus.DRAFT,
        displayName: 'Karim',
        professionId: 'prof-id',
        locations: [{ id: 'loc-1' }],
        services: [{ id: 'svc-1' }],
      });
      prismaMock.freelancerProfile.update.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.PENDING,
      });

      const res = await service.submitProfile('user-1');
      expect(res.status).toBe(FreelancerStatus.PENDING);
    });
  });
});

