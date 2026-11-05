import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { MembershipsService } from '../memberships.service.js';

@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(private readonly membershipsService: MembershipsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (!user.sub && !user.id)) {
      throw new ForbiddenException('User authentication required');
    }

    const userId = user.sub || user.id;
    const hasActivePlan = await this.membershipsService.checkUserAccess(userId);

    if (!hasActivePlan) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Active membership plan required to access this feature.',
        code: 'MEMBERSHIP_REQUIRED',
      });
    }

    return true;
  }
}

