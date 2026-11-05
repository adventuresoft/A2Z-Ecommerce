import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller.js';
import { LocationsService } from './locations.service.js';
import { LocationsValidationService } from './locations-validation.service.js';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService, LocationsValidationService],
  exports: [LocationsService, LocationsValidationService],
})
export class LocationsModule {}

