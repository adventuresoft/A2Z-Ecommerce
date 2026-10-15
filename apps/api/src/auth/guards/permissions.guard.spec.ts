import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionsGuard } from './permissions.guard.js';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import type { RequiredPermission } from '../decorators/require-permission.decorator.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflectorMock: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    reflectorMock = {
      getAllAndOverride: vi.fn(),
    };
    guard = new PermissionsGuard(reflectorMock as unknown as Reflector);
  });

  function createMockContext(user?: { role?: Role }): ExecutionContext {
    const request = { user };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no permission metadata is defined on route', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: Role.ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user or user role is missing', () => {
    reflectorMock.getAllAndOverride.mockReturnValue({
      module: 'categories',
      action: 'delete',
    } satisfies RequiredPermission);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow SUPER_ADMIN on any module and action (including delete)', () => {
    reflectorMock.getAllAndOverride.mockReturnValue({
      module: 'categories',
      action: 'delete',
    } satisfies RequiredPermission);
    const context = createMockContext({ role: Role.SUPER_ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject ADMIN when attempting delete action with 403 Forbidden', () => {
    reflectorMock.getAllAndOverride.mockReturnValue({
      module: 'categories',
      action: 'delete',
    } satisfies RequiredPermission);
    const context = createMockContext({ role: Role.ADMIN });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow ADMIN when attempting create, read, or update action', () => {
    reflectorMock.getAllAndOverride.mockReturnValue({
      module: 'categories',
      action: 'update',
    } satisfies RequiredPermission);
    const context = createMockContext({ role: Role.ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SHOP_MANAGER to delete products', () => {
    reflectorMock.getAllAndOverride.mockReturnValue({
      module: 'products',
      action: 'delete',
    } satisfies RequiredPermission);
    const context = createMockContext({ role: Role.SHOP_MANAGER });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject SHOP_MANAGER when attempting to delete categories', () => {
    reflectorMock.getAllAndOverride.mockReturnValue({
      module: 'categories',
      action: 'delete',
    } satisfies RequiredPermission);
    const context = createMockContext({ role: Role.SHOP_MANAGER });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
