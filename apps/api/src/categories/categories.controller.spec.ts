import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesAdminController } from './categories.admin.controller.js';
import { CategoriesPublicController } from './categories.public.controller.js';

describe('Categories Controllers', () => {
  let adminController: CategoriesAdminController;
  let publicController: CategoriesPublicController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      create: vi.fn(),
      findAllAdmin: vi.fn(),
      getParentOptions: vi.fn(),
      findOneAdmin: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      findPublicTree: vi.fn(),
      findBrowseCatalog: vi.fn(),
      findBySlug: vi.fn(),
    };

    adminController = new CategoriesAdminController(serviceMock);
    publicController = new CategoriesPublicController(serviceMock);
  });

  describe('CategoriesAdminController', () => {
    it('should create a category', async () => {
      const dto = { name: 'Laptops' };
      const expected = { id: '1', name: 'Laptops', slug: 'laptops' };
      serviceMock.create.mockResolvedValueOnce(expected);

      const result = await adminController.create(dto);
      expect(result).toEqual(expected);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
    });

    it('should list categories with query filters', async () => {
      const query = { page: 1, limit: 10, search: 'lap' };
      const expected = { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
      serviceMock.findAllAdmin.mockResolvedValueOnce(expected);

      const result = await adminController.findAll(query);
      expect(result).toEqual(expected);
      expect(serviceMock.findAllAdmin).toHaveBeenCalledWith(query);
    });

    it('should fetch eligible parent options', async () => {
      const expected = [{ id: '1', name: 'Electronics', slug: 'electronics', depth: 1 }];
      serviceMock.getParentOptions.mockResolvedValueOnce(expected);

      const result = await adminController.getParentOptions('exclude-1');
      expect(result).toEqual(expected);
      expect(serviceMock.getParentOptions).toHaveBeenCalledWith('exclude-1');
    });

    it('should get single category by ID', async () => {
      const expected = { id: 'cat-1', name: 'Laptops' };
      serviceMock.findOneAdmin.mockResolvedValueOnce(expected);

      const result = await adminController.findOne('cat-1');
      expect(result).toEqual(expected);
      expect(serviceMock.findOneAdmin).toHaveBeenCalledWith('cat-1');
    });

    it('should update category', async () => {
      const dto = { name: 'Updated Laptops' };
      const expected = { id: 'cat-1', name: 'Updated Laptops' };
      serviceMock.update.mockResolvedValueOnce(expected);

      const result = await adminController.update('cat-1', dto);
      expect(result).toEqual(expected);
      expect(serviceMock.update).toHaveBeenCalledWith('cat-1', dto);
    });

    it('should delete category', async () => {
      const expected = { success: true, message: 'Deleted' };
      serviceMock.remove.mockResolvedValueOnce(expected);

      const result = await adminController.remove('cat-1');
      expect(result).toEqual(expected);
      expect(serviceMock.remove).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('CategoriesPublicController', () => {
    it('should fetch public category tree', async () => {
      const expected = [{ id: '1', name: 'Electronics', children: [] }];
      serviceMock.findPublicTree.mockResolvedValueOnce(expected);

      const result = await publicController.getTree();
      expect(result).toEqual(expected);
      expect(serviceMock.findPublicTree).toHaveBeenCalled();
    });

    it('should fetch browse catalog categories', async () => {
      const expected = [{ id: 'sub-1', name: 'Gaming Laptops', showInBrowseCatalog: true }];
      serviceMock.findBrowseCatalog.mockResolvedValueOnce(expected);

      const result = await publicController.getBrowseCatalog();
      expect(result).toEqual(expected);
      expect(serviceMock.findBrowseCatalog).toHaveBeenCalled();
    });

    it('should get category by slug with breadcrumbs', async () => {
      const expected = { id: '1', name: 'Laptops', slug: 'laptops', breadcrumbs: [] };
      serviceMock.findBySlug.mockResolvedValueOnce(expected);

      const result = await publicController.getBySlug('laptops');
      expect(result).toEqual(expected);
      expect(serviceMock.findBySlug).toHaveBeenCalledWith('laptops');
    });
  });
});
