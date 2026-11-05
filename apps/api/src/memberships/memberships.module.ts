import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { MembershipsService } from './memberships.service.js';
import { MembershipsController } from './memberships.controller.js';
import { MembershipsAdminController } from './memberships-admin.controller.js';
import { MembershipGuard } from './guards/membership.guard.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MembershipsController, MembershipsAdminController],
  providers: [MembershipsService, MembershipGuard],
  exports: [MembershipsService, MembershipGuard],
})
export class MembershipsModule {}

