import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role, AttributeType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AttributesAdminController } from './attributes.admin.controller.js';

describe('AttributesAdminController', () => {
  let controller: AttributesAdminController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      create: vi.fn(),
      findAllAdmin: vi.fn(),
      findOneAdmin: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      createValue: vi.fn(),
      updateValue: vi.fn(),
      removeValue: vi.fn(),
    };

    controller = new AttributesAdminController(serviceMock);
  });

  it('should have JwtAuthGuard and RolesGuard metadata', () => {
    const guards = Reflect.getMetadata('__guards__', AttributesAdminController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(RolesGuard);
  });

  it('should have ADMIN, SUPER_ADMIN, and SHOP_MANAGER roles metadata', () => {
    const roles = Reflect.getMetadata('roles', AttributesAdminController);
    expect(roles).toBeDefined();
    expect(roles).toEqual([Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER]);
  });

  it('should delegate create to service', async () => {
    const dto = { name: 'Color', type: AttributeType.COLOR };
    serviceMock.create.mockResolvedValueOnce({ id: 'attr-1', ...dto });

    const result = await controller.create(dto);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('attr-1');
  });

  it('should delegate findAll to service', async () => {
    const query = { page: 1, limit: 10 };
    serviceMock.findAllAdmin.mockResolvedValueOnce({ items: [], total: 0 });

    const result = await controller.findAll(query);
    expect(serviceMock.findAllAdmin).toHaveBeenCalledWith(query);
    expect(result.items).toEqual([]);
  });

  it('should delegate findOne to service', async () => {
    serviceMock.findOneAdmin.mockResolvedValueOnce({ id: 'attr-1', name: 'Color' });

    const result = await controller.findOne('attr-1');
    expect(serviceMock.findOneAdmin).toHaveBeenCalledWith('attr-1');
    expect(result.name).toBe('Color');
  });

  it('should delegate update and patch to service', async () => {
    const dto = { name: 'Primary Color' };
    serviceMock.update.mockResolvedValueOnce({ id: 'attr-1', ...dto });

    const result = await controller.update('attr-1', dto);
    expect(serviceMock.update).toHaveBeenCalledWith('attr-1', dto);
    expect(result.name).toBe('Primary Color');

    await controller.patch('attr-1', dto);
    expect(serviceMock.update).toHaveBeenCalledTimes(2);
  });

  it('should delegate remove to service', async () => {
    serviceMock.remove.mockResolvedValueOnce({ success: true, message: 'Deleted' });

    const result = await controller.remove('attr-1');
    expect(serviceMock.remove).toHaveBeenCalledWith('attr-1');
    expect(result.success).toBe(true);
  });

  it('should delegate value operations to service', async () => {
    const valDto = { value: 'Navy Blue', colorCode: '#000080' };
    serviceMock.createValue.mockResolvedValueOnce({ id: 'val-1', ...valDto });
    serviceMock.updateValue.mockResolvedValueOnce({ id: 'val-1', value: 'Dark Navy' });
    serviceMock.removeValue.mockResolvedValueOnce({ success: true, message: 'Deleted' });

    const created = await controller.createValue('attr-1', valDto);
    expect(serviceMock.createValue).toHaveBeenCalledWith('attr-1', valDto);
    expect(created.id).toBe('val-1');

    const updated = await controller.updateValue('attr-1', 'val-1', { value: 'Dark Navy' });
    expect(serviceMock.updateValue).toHaveBeenCalledWith('attr-1', 'val-1', { value: 'Dark Navy' });
    expect(updated.value).toBe('Dark Navy');

    const deleted = await controller.removeValue('attr-1', 'val-1');
    expect(serviceMock.removeValue).toHaveBeenCalledWith('attr-1', 'val-1');
    expect(deleted.success).toBe(true);
  });
});
