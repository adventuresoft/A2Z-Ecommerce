import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesService } from './roles.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('RolesService', () => {
  let service: RolesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      roleDefinition: {
        count: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new RolesService(prismaMock as unknown as PrismaService);
  });

  it('should seed default roles when table is empty', async () => {
    prismaMock.roleDefinition.count.mockResolvedValue(0);
    prismaMock.roleDefinition.upsert.mockResolvedValue({});

    await service.seedDefaultRoles();

    expect(prismaMock.roleDefinition.upsert).toHaveBeenCalled();
  });

  it('should return all roles with computed capabilities', async () => {
    const mockRoles = [
      {
        id: 'role-1',
        name: 'SuperAdmin',
        slug: 'superadmin',
        description: 'Root access',
        isSystem: true,
        permissions: ['products.read', 'products.create', 'products.update', 'products.delete'],
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { users: 2 },
      },
    ];
    prismaMock.roleDefinition.findMany.mockResolvedValue(mockRoles);

    const roles = await service.getAllRoles();
    expect(roles.length).toBe(1);
    expect(roles[0].name).toBe('SuperAdmin');
    expect(roles[0].permissionCount).toBe(4);
    expect(roles[0].capabilities?.find((c) => c.module === 'products')).toEqual({
      module: 'products',
      read: true,
      create: true,
      update: true,
      delete: true,
    });
  });

  it('should prevent deleting system-reserved roles', async () => {
    prismaMock.roleDefinition.findUnique.mockResolvedValue({
      id: 'role-1',
      name: 'SuperAdmin',
      isSystem: true,
      _count: { users: 0 },
    });

    await expect(service.deleteRole('role-1')).rejects.toThrow(
      "Cannot delete system-reserved role 'SuperAdmin'",
    );
  });

  it('should prevent deleting roles with assigned users', async () => {
    prismaMock.roleDefinition.findUnique.mockResolvedValue({
      id: 'role-2',
      name: 'Custom Admin',
      isSystem: false,
      _count: { users: 3 },
    });

    await expect(service.deleteRole('role-2')).rejects.toThrow(
      "Cannot delete role 'Custom Admin' because 3 user(s) are currently assigned to it",
    );
  });
});
