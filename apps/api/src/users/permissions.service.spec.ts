import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionsService } from './permissions.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      permissionDefinition: {
        count: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new PermissionsService(prismaMock as unknown as PrismaService);
  });

  it('should seed default permissions when table is empty', async () => {
    prismaMock.permissionDefinition.count.mockResolvedValue(0);
    prismaMock.permissionDefinition.upsert.mockResolvedValue({});

    await service.seedDefaultPermissions();

    expect(prismaMock.permissionDefinition.upsert).toHaveBeenCalled();
  });

  it('should return all permissions sorted', async () => {
    const mockList = [
      {
        id: 'p-1',
        key: 'user.read',
        name: 'READ User',
        module: 'user',
        action: 'read',
        description: 'Read users',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    prismaMock.permissionDefinition.findMany.mockResolvedValue(mockList);

    const result = await service.getAllPermissions();
    expect(result.length).toBe(1);
    expect(result[0].key).toBe('user.read');
  });

  it('should prevent deleting system-reserved permissions', async () => {
    prismaMock.permissionDefinition.findUnique.mockResolvedValue({
      id: 'p-1',
      key: 'user.read',
      isSystem: true,
    });

    await expect(service.deletePermission('p-1')).rejects.toThrow(
      "Cannot delete system-reserved permission 'user.read'",
    );
  });
});
