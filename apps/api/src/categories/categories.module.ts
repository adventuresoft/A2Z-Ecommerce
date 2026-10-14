import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CategoriesAdminController } from './categories.admin.controller.js';
import { CategoriesPublicController } from './categories.public.controller.js';
import { CategoriesService } from './categories.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CategoriesAdminController, CategoriesPublicController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
