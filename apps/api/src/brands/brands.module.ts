import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BrandsAdminController } from './brands.admin.controller.js';
import { BrandsPublicController } from './brands.public.controller.js';
import { BrandsService } from './brands.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BrandsAdminController, BrandsPublicController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
