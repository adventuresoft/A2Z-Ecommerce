import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from '../decorators/require-permission.decorator.js';
import { hasPermission } from '../constants/permissions.constant.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requirement = this.reflector.getAllAndOverride<
      RequiredPermission | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requirement) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException(
        'Access denied: user role could not be verified',
      );
    }

    const allowed = hasPermission(
      user.role as Role,
      requirement.module,
      requirement.action,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Access denied: role '${user.role}' lacks '${requirement.action}' permission on module '${requirement.module}'`,
      );
    }

    return true;
  }
}
