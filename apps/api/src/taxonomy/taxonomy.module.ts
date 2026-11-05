import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TaxonomyPublicController } from './taxonomy.public.controller.js';
import { TaxonomyFreelancerController } from './taxonomy.freelancer.controller.js';
import { TaxonomyAdminController } from './taxonomy.admin.controller.js';
import { TaxonomyService } from './taxonomy.service.js';

@Module({
  imports: [AuthModule],
  controllers: [
    TaxonomyPublicController,
    TaxonomyFreelancerController,
    TaxonomyAdminController,
  ],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}

