import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { ReviewsService } from './reviews.service.js';
import { ReviewsAdminController } from './reviews.admin.controller.js';
import { ReviewsPublicController } from './reviews.public.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReviewsAdminController, ReviewsPublicController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
