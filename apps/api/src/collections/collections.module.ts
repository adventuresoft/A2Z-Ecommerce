import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CollectionsAdminController } from './collections.admin.controller.js';
import { CollectionsPublicController } from './collections.public.controller.js';
import { CollectionsService } from './collections.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CollectionsAdminController, CollectionsPublicController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}

