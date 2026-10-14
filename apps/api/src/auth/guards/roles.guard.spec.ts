import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflectorMock: any;

  beforeEach(() => {
    reflectorMock = {
      getAllAndOverride: vi.fn(),
    };
    guard = new RolesGuard(reflectorMock as unknown as Reflector);
  });

  function createMockContext(user?: any): ExecutionContext {
    const request = { user };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: Role.CUSTOMER });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has one of required roles', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.SUPER_ADMIN]);
    const context = createMockContext({ role: Role.ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user role is not authorized', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.SUPER_ADMIN]);
    const context = createMockContext({ role: Role.CUSTOMER });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user object is missing', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
