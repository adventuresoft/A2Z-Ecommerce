import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { RolesService } from './roles.service.js';
import { PermissionsService } from './permissions.service.js';
import { UsersAdminController } from './users.admin.controller.js';
import { RolesAdminController } from './roles.admin.controller.js';
import { PermissionsAdminController } from './permissions.admin.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    UsersAdminController,
    RolesAdminController,
    PermissionsAdminController,
  ],
  providers: [
    UsersService,
    RolesService,
    PermissionsService,
  ],
  exports: [
    UsersService,
    RolesService,
    PermissionsService,
  ],
})
export class UsersModule {}
