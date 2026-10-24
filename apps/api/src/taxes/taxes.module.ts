import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TaxesAdminController } from './taxes.admin.controller.js';
import { TaxesService } from './taxes.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [TaxesAdminController],
  providers: [TaxesService],
  exports: [TaxesService],
})
export class TaxesModule {}
