import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsPublicController } from './products.public.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsPublicController', () => {
  let controller: ProductsPublicController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      findPublicProducts: vi.fn(),
      findPublicProductBySlug: vi.fn(),
      getSearchSuggestions: vi.fn(),
    };
    controller = new ProductsPublicController(serviceMock as unknown as ProductsService);
  });

  it('should delegate getCatalog to productsService.findPublicProducts', async () => {
    const mockResponse = {
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 1,
    };
    serviceMock.findPublicProducts.mockResolvedValue(mockResponse);

    const query = { page: 1, limit: 12, categorySlug: 'laptops' };
    const result = await controller.getCatalog(query);

    expect(result).toBe(mockResponse);
    expect(serviceMock.findPublicProducts).toHaveBeenCalledWith(query);
  });

  it('should delegate getBySlug to productsService.findPublicProductBySlug', async () => {
    const mockDetail = {
      id: 'p-1',
      title: 'MacBook Pro',
      slug: 'macbook-pro',
    };
    serviceMock.findPublicProductBySlug.mockResolvedValue(mockDetail);

    const result = await controller.getBySlug('macbook-pro');

    expect(result).toBe(mockDetail);
    expect(serviceMock.findPublicProductBySlug).toHaveBeenCalledWith('macbook-pro');
  });

  it('should delegate getSearchSuggestions to productsService.getSearchSuggestions', async () => {
    const mockSuggestions = {
      products: [{ id: 'p-1', title: 'MacBook', slug: 'macbook', price: 2000, category: 'Laptops' }],
      categories: [{ id: 'c-1', name: 'Laptops', slug: 'laptops' }],
    };
    serviceMock.getSearchSuggestions.mockResolvedValue(mockSuggestions);

    const result = await controller.getSearchSuggestions('mac');

    expect(result).toBe(mockSuggestions);
    expect(serviceMock.getSearchSuggestions).toHaveBeenCalledWith('mac');
  });

  it('should delegate getCurated to productsService.getCuratedProducts', async () => {
    const mockCurated = {
      flashDeals: [],
      featured: [],
      newArrivals: [],
      bestSellers: [],
    };
    serviceMock.getCuratedProducts = vi.fn().mockResolvedValue(mockCurated);

    const result = await controller.getCurated();

    expect(result).toBe(mockCurated);
    expect(serviceMock.getCuratedProducts).toHaveBeenCalled();
  });
});
