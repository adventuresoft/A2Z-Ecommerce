import { Module } from '@nestjs/common';
import { FreelancerReviewsController } from './freelancer-reviews.controller.js';
import { FreelancerReviewsService } from './freelancer-reviews.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogsModule],
  controllers: [FreelancerReviewsController],
  providers: [FreelancerReviewsService],
  exports: [FreelancerReviewsService],
})
export class FreelancerReviewsModule {}

