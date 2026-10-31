import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TagsAdminController } from './tags.admin.controller.js';
import { TagsPublicController } from './tags.public.controller.js';
import { TagsService } from './tags.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TagsAdminController, TagsPublicController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
