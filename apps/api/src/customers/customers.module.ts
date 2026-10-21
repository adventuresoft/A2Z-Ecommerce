import { Module } from '@nestjs/common';
import { CustomersAdminController } from './customers.admin.controller.js';
import { CustomersService } from './customers.service.js';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CustomersAdminController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
