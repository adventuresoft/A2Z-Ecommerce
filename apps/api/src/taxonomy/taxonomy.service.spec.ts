import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service.js';
import { SkillStatus } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('TaxonomyService', () => {
  let service: TaxonomyService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      professionCategory: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      profession: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      skill: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new TaxonomyService(mockPrisma as unknown as PrismaService);
  });

  describe('getCategories', () => {
    it('returns active categories ordered by sortOrder and name', async () => {
      const mockCats = [{ id: 'c1', name: 'Home Services', isActive: true, sortOrder: 1 }];
      mockPrisma.professionCategory.findMany.mockResolvedValueOnce(mockCats);

      const res = await service.getCategories();
      expect(res).toEqual(mockCats);
      expect(mockPrisma.professionCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('getProfessions', () => {
    it('filters professions by categoryId when provided', async () => {
      const mockProfs = [{ id: 'p1', categoryId: 'c1', name: 'Electrician' }];
      mockPrisma.profession.findMany.mockResolvedValueOnce(mockProfs);

      const res = await service.getProfessions({ categoryId: 'c1' });
      expect(res).toEqual(mockProfs);
      expect(mockPrisma.profession.findMany).toHaveBeenCalledWith({
        where: { isActive: true, categoryId: 'c1' },
        include: { category: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('getSkills', () => {
    it('returns only ACTIVE skills filtered by professionId', async () => {
      const mockSkills = [{ id: 's1', professionId: 'p1', name: 'House Wiring', status: SkillStatus.ACTIVE }];
      mockPrisma.skill.findMany.mockResolvedValueOnce(mockSkills);

      const res = await service.getSkills({ professionId: 'p1' });
      expect(res).toEqual(mockSkills);
      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
        where: { status: SkillStatus.ACTIVE, professionId: 'p1' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('suggestSkill', () => {
    it('throws NotFoundException if profession does not exist or is inactive', async () => {
      mockPrisma.profession.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.suggestSkill('u1', { professionId: 'p1', name: 'Solar Wiring' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if active skill with same name exists under profession', async () => {
      mockPrisma.profession.findUnique.mockResolvedValueOnce({ id: 'p1', isActive: true });
      mockPrisma.skill.findFirst.mockResolvedValueOnce({ id: 's1', name: 'Solar Wiring', status: SkillStatus.ACTIVE });

      await expect(
        service.suggestSkill('u1', { professionId: 'p1', name: 'Solar Wiring' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates skill suggestion in PENDING status with suggestedById', async () => {
      mockPrisma.profession.findUnique.mockResolvedValueOnce({ id: 'p1', isActive: true });
      mockPrisma.skill.findFirst.mockResolvedValueOnce(null); // No active duplicate
      mockPrisma.skill.findFirst.mockResolvedValueOnce(null); // No pending duplicate
      const createdSkill = {
        id: 's2',
        professionId: 'p1',
        name: 'Solar Panel Maintenance',
        bnName: 'সোলার প্যানেল মেরামত',
        status: SkillStatus.PENDING,
        suggestedById: 'u1',
      };
      mockPrisma.skill.create.mockResolvedValueOnce(createdSkill);

      const res = await service.suggestSkill('u1', {
        professionId: 'p1',
        name: '  Solar Panel Maintenance  ',
        bnName: '  সোলার প্যানেল মেরামত  ',
      });

      expect(res).toEqual(createdSkill);
      expect(mockPrisma.skill.create).toHaveBeenCalledWith({
        data: {
          professionId: 'p1',
          name: 'Solar Panel Maintenance',
          bnName: 'সোলার প্যানেল মেরামত',
          status: SkillStatus.PENDING,
          suggestedById: 'u1',
        },
      });
    });
  });

  describe('Admin suggestion moderation', () => {
    it('approveSuggestion updates status to ACTIVE', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 's1', status: SkillStatus.PENDING });
      mockPrisma.skill.update.mockResolvedValueOnce({ id: 's1', status: SkillStatus.ACTIVE });

      const res = await service.approveSuggestion('s1');
      expect(res.status).toBe(SkillStatus.ACTIVE);
      expect(mockPrisma.skill.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: SkillStatus.ACTIVE },
      });
    });

    it('rejectSuggestion updates status to REJECTED', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 's1', status: SkillStatus.PENDING });
      mockPrisma.skill.update.mockResolvedValueOnce({ id: 's1', status: SkillStatus.REJECTED });

      const res = await service.rejectSuggestion('s1');
      expect(res.status).toBe(SkillStatus.REJECTED);
      expect(mockPrisma.skill.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: SkillStatus.REJECTED },
      });
    });

    it('mergeSuggestion rejects self-merge with BadRequestException', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 's1', status: SkillStatus.PENDING });

      await expect(service.mergeSuggestion('s1', { targetSkillId: 's1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('mergeSuggestion marks as REJECTED with mergedIntoId referencing target skill', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 's1', status: SkillStatus.PENDING });
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 's2', status: SkillStatus.ACTIVE });
      mockPrisma.skill.update.mockResolvedValueOnce({
        id: 's1',
        status: SkillStatus.REJECTED,
        mergedIntoId: 's2',
      });

      const res = await service.mergeSuggestion('s1', { targetSkillId: 's2' });
      expect(res.status).toBe(SkillStatus.REJECTED);
      expect(res.mergedIntoId).toBe('s2');
      expect(mockPrisma.skill.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: {
          status: SkillStatus.REJECTED,
          mergedIntoId: 's2',
        },
      });
    });
  });
});

