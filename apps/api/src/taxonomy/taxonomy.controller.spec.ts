import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaxonomyPublicController } from './taxonomy.public.controller.js';
import { TaxonomyFreelancerController } from './taxonomy.freelancer.controller.js';
import { TaxonomyAdminController } from './taxonomy.admin.controller.js';
import type { TaxonomyService } from './taxonomy.service.js';

describe('Taxonomy Controllers', () => {
  let mockService: any;
  let publicController: TaxonomyPublicController;
  let freelancerController: TaxonomyFreelancerController;
  let adminController: TaxonomyAdminController;

  beforeEach(() => {
    mockService = {
      getCategories: vi.fn(),
      getProfessions: vi.fn(),
      getSkills: vi.fn(),
      suggestSkill: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      createProfession: vi.fn(),
      updateProfession: vi.fn(),
      createSkill: vi.fn(),
      getPendingSuggestions: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
      mergeSuggestion: vi.fn(),
    };

    publicController = new TaxonomyPublicController(mockService as unknown as TaxonomyService);
    freelancerController = new TaxonomyFreelancerController(mockService as unknown as TaxonomyService);
    adminController = new TaxonomyAdminController(mockService as unknown as TaxonomyService);
  });

  describe('TaxonomyPublicController', () => {
    it('getCategories delegates to taxonomyService.getCategories', async () => {
      mockService.getCategories.mockResolvedValueOnce([{ id: 'c1' }]);
      const res = await publicController.getCategories();
      expect(res).toEqual([{ id: 'c1' }]);
      expect(mockService.getCategories).toHaveBeenCalled();
    });

    it('getProfessions delegates with query', async () => {
      mockService.getProfessions.mockResolvedValueOnce([{ id: 'p1' }]);
      const res = await publicController.getProfessions({ categoryId: 'c1' });
      expect(res).toEqual([{ id: 'p1' }]);
      expect(mockService.getProfessions).toHaveBeenCalledWith({ categoryId: 'c1' });
    });

    it('getSkills delegates with query', async () => {
      mockService.getSkills.mockResolvedValueOnce([{ id: 's1' }]);
      const res = await publicController.getSkills({ professionId: 'p1' });
      expect(res).toEqual([{ id: 's1' }]);
      expect(mockService.getSkills).toHaveBeenCalledWith({ professionId: 'p1' });
    });
  });

  describe('TaxonomyFreelancerController', () => {
    it('suggestSkill delegates with authenticated user id and dto', async () => {
      mockService.suggestSkill.mockResolvedValueOnce({ id: 's1', status: 'PENDING' });
      const user = { sub: 'u1', email: 'test@example.com', role: 'CUSTOMER' } as any;
      const dto = { professionId: 'p1', name: 'New Skill' };

      const res = await freelancerController.suggestSkill(user, dto);
      expect(res).toEqual({ id: 's1', status: 'PENDING' });
      expect(mockService.suggestSkill).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('TaxonomyAdminController', () => {
    it('approveSuggestion calls taxonomyService.approveSuggestion', async () => {
      mockService.approveSuggestion.mockResolvedValueOnce({ id: 's1', status: 'ACTIVE' });
      const res = await adminController.approveSuggestion('s1');
      expect(res).toEqual({ id: 's1', status: 'ACTIVE' });
      expect(mockService.approveSuggestion).toHaveBeenCalledWith('s1');
    });

    it('mergeSuggestion calls taxonomyService.mergeSuggestion', async () => {
      mockService.mergeSuggestion.mockResolvedValueOnce({ id: 's1', mergedIntoId: 's2' });
      const res = await adminController.mergeSuggestion('s1', { targetSkillId: 's2' });
      expect(res).toEqual({ id: 's1', mergedIntoId: 's2' });
      expect(mockService.mergeSuggestion).toHaveBeenCalledWith('s1', { targetSkillId: 's2' });
    });
  });
});

