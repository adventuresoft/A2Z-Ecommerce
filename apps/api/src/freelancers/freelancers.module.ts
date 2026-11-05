import { Module } from '@nestjs/common';
import { FreelancerRegistrationController } from './freelancer-registration.controller.js';
import { FreelancerRegistrationService } from './freelancer-registration.service.js';
import { FreelancerProfileController } from './freelancer-profile.controller.js';
import { FreelancerProfileService } from './freelancer-profile.service.js';
import { AdminFreelancersController } from './admin-freelancers.controller.js';
import { AdminFreelancersService } from './admin-freelancers.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { LocationsModule } from '../locations/locations.module.js';

@Module({
  imports: [AuthModule, LocationsModule],
  controllers: [
    FreelancerRegistrationController,
    FreelancerProfileController,
    AdminFreelancersController,
  ],
  providers: [
    FreelancerRegistrationService,
    FreelancerProfileService,
    AdminFreelancersService,
  ],
  exports: [
    FreelancerRegistrationService,
    FreelancerProfileService,
    AdminFreelancersService,
  ],
})
export class FreelancersModule {}

