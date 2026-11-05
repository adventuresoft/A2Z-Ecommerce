import { Module } from '@nestjs/common';
import { TaxonomyPublicController } from './taxonomy.public.controller.js';
import { TaxonomyFreelancerController } from './taxonomy.freelancer.controller.js';
import { TaxonomyAdminController } from './taxonomy.admin.controller.js';
import { TaxonomyService } from './taxonomy.service.js';

@Module({
  controllers: [
    TaxonomyPublicController,
    TaxonomyFreelancerController,
    TaxonomyAdminController,
  ],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}

