import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttributesPublicController } from './attributes.public.controller.js';

describe('AttributesPublicController', () => {
  let controller: AttributesPublicController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      findAllPublic: vi.fn(),
      findBySlugPublic: vi.fn(),
    };
    controller = new AttributesPublicController(serviceMock);
  });

  it('should delegate findAll to service.findAllPublic', async () => {
    serviceMock.findAllPublic.mockResolvedValueOnce([{ id: 'attr-1', name: 'Color' }]);

    const result = await controller.findAll();
    expect(serviceMock.findAllPublic).toHaveBeenCalled();
    expect(result.length).toBe(1);
  });

  it('should delegate findBySlug to service.findBySlugPublic', async () => {
    serviceMock.findBySlugPublic.mockResolvedValueOnce({ id: 'attr-1', slug: 'color' });

    const result = await controller.findBySlug('color');
    expect(serviceMock.findBySlugPublic).toHaveBeenCalledWith('color');
    expect(result.slug).toBe('color');
  });
});
