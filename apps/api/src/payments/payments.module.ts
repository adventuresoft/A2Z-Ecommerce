import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsAdminController } from './payments.admin.controller.js';
import { RefundsAdminController } from './refunds.admin.controller.js';
import { PaymentMethodsAdminController } from './payment-methods.admin.controller.js';
import { PaymentMethodsController } from './payment-methods.controller.js';
import { PaystationService } from './paystation.service.js';
import { PaystationController } from './paystation.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    PaymentsAdminController,
    RefundsAdminController,
    PaymentMethodsAdminController,
    PaymentMethodsController,
    PaystationController,
  ],
  providers: [PaymentsService, PaystationService],
  exports: [PaymentsService, PaystationService],
})
export class PaymentsModule {}
