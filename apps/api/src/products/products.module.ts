import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductsAdminController } from './products.admin.controller.js';
import { ProductsService } from './products.service.js';
import { VariantsAdminController } from './variants.admin.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProductsAdminController, VariantsAdminController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
