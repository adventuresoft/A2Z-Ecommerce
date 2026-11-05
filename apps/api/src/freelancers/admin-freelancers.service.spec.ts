import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminFreelancersService } from './admin-freelancers.service.js';
import { FreelancerStatus, RevisionStatus } from '@prisma/client';

describe('AdminFreelancersService', () => {
  let service: AdminFreelancersService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      freelancerProfile: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      profileRevision: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      portfolioItem: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prismaMock)),
    };

    service = new AdminFreelancersService(prismaMock);
  });

  describe('approveFreelancer', () => {
    it('should set status to APPROVED and record approvedAt and approvedById', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.PENDING,
      });
      prismaMock.freelancerProfile.update.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.APPROVED,
        approvedById: 'admin-1',
      });

      const res = await service.approveFreelancer('prof-1', 'admin-1');
      expect(res.profile.status).toBe(FreelancerStatus.APPROVED);
      expect(prismaMock.freelancerProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prof-1' },
          data: expect.objectContaining({
            status: FreelancerStatus.APPROVED,
            approvedById: 'admin-1',
          }),
        }),
      );
    });
  });

  describe('rejectFreelancer', () => {
    it('should set status to REJECTED, record reason, and increment counter', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        rejectionCount: 1,
      });
      prismaMock.freelancerProfile.update.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.REJECTED,
      });

      const res = await service.rejectFreelancer('prof-1', {
        reason: 'Image blurred',
      });

      expect(res.rejectionReason).toBe('Image blurred');
      expect(res.rejectionCount).toBe(2);
      expect(res.flaggedForAudit).toBe(false);
    });

    it('should flag for audit if rejection count reaches 3', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        rejectionCount: 2,
      });
      prismaMock.freelancerProfile.update.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.REJECTED,
      });

      const res = await service.rejectFreelancer('prof-1', {
        reason: 'Third rejection',
      });

      expect(res.rejectionCount).toBe(3);
      expect(res.flaggedForAudit).toBe(true);
    });
  });

  describe('suspend and reinstate', () => {
    it('should suspend freelancer with reason', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.APPROVED,
      });
      prismaMock.freelancerProfile.update.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.SUSPENDED,
      });

      const res = await service.suspendFreelancer('prof-1', {
        reason: 'Violation of policy',
      });

      expect(res.profile.status).toBe(FreelancerStatus.SUSPENDED);
    });

    it('should reinstate suspended freelancer to APPROVED', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.SUSPENDED,
      });
      prismaMock.freelancerProfile.update.mockResolvedValue({
        id: 'prof-1',
        status: FreelancerStatus.APPROVED,
      });

      const res = await service.reinstateFreelancer('prof-1');
      expect(res.profile.status).toBe(FreelancerStatus.APPROVED);
    });
  });

  describe('revisions approval and rejection', () => {
    it('should approve revision and merge payload into live profile', async () => {
      prismaMock.profileRevision.findUnique.mockResolvedValue({
        id: 'rev-1',
        freelancerId: 'prof-1',
        status: RevisionStatus.PENDING,
        payload: {
          displayName: 'Updated Name',
          about: 'New bio',
          portfolio: [{ imageUrl: 'https://cdn.example.com/item1.jpg', caption: 'Job' }],
        },
      });

      const res = await service.approveRevision('rev-1', 'admin-1');

      expect(res.message).toContain('Profile revision approved');
      expect(prismaMock.freelancerProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: {
          displayName: 'Updated Name',
          about: 'New bio',
        },
      });
      expect(prismaMock.portfolioItem.deleteMany).toHaveBeenCalledWith({
        where: { freelancerId: 'prof-1' },
      });
      expect(prismaMock.portfolioItem.createMany).toHaveBeenCalled();
      expect(prismaMock.profileRevision.update).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
        data: {
          status: RevisionStatus.APPROVED,
          reviewedById: 'admin-1',
        },
      });
    });

    it('should reject revision and keep live profile unchanged', async () => {
      prismaMock.profileRevision.findUnique.mockResolvedValue({
        id: 'rev-1',
        freelancerId: 'prof-1',
        status: RevisionStatus.PENDING,
      });
      prismaMock.profileRevision.update.mockResolvedValue({
        id: 'rev-1',
        status: RevisionStatus.REJECTED,
      });

      const res = await service.rejectRevision(
        'rev-1',
        { reason: 'Inappropriate picture' },
        'admin-1',
      );

      expect(res.revision.status).toBe(RevisionStatus.REJECTED);
      expect(prismaMock.freelancerProfile.update).not.toHaveBeenCalled();
    });
  });
});

