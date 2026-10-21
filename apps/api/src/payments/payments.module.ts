import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsAdminController } from './payments.admin.controller.js';
import { RefundsAdminController } from './refunds.admin.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PaymentsAdminController, RefundsAdminController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
