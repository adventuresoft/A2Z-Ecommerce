import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AttributesAdminController } from './attributes.admin.controller.js';
import { AttributesPublicController } from './attributes.public.controller.js';
import { AttributesService } from './attributes.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AttributesAdminController, AttributesPublicController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}
