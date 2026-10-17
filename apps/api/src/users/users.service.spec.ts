import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new UsersService(prismaMock as unknown as PrismaService);
  });

  it('should find user by id', async () => {
    const mockUser = { id: 'uuid-1', email: 'test@az.local' };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.findById('uuid-1');
    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      include: { roleDefinition: true },
    });
  });

  it('should find user by email normalized', async () => {
    const mockUser = { id: 'uuid-1', email: 'test@az.local' };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.findByEmail('  TEST@az.local ');
    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@az.local' },
      include: { roleDefinition: true },
    });
  });

  it('should create user with default CUSTOMER role', async () => {
    const createData = {
      email: 'customer@az.local',
      passwordHash: 'hashed123',
      name: 'Customer Name',
    };
    const createdUser = {
      id: 'uuid-2',
      ...createData,
      role: Role.CUSTOMER,
      tokenVersion: 0,
      isActive: true,
    };
    prismaMock.user.create.mockResolvedValue(createdUser);

    const result = await service.create(createData);
    expect(result).toEqual(createdUser);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'customer@az.local',
        passwordHash: 'hashed123',
        name: 'Customer Name',
        phone: undefined,
        role: 'CUSTOMER',
      },
    });
  });

  it('should increment tokenVersion', async () => {
    const updatedUser = { id: 'uuid-1', tokenVersion: 1 };
    prismaMock.user.update.mockResolvedValue(updatedUser);

    const result = await service.incrementTokenVersion('uuid-1');
    expect(result).toEqual(updatedUser);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      data: { tokenVersion: { increment: 1 } },
    });
  });
});
