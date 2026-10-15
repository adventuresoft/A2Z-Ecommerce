import { SetMetadata } from '@nestjs/common';
import type {
  AppModule,
  ModuleAction,
} from '../constants/permissions.constant.js';

export const PERMISSION_KEY = 'required_permission';

export interface RequiredPermission {
  module: AppModule;
  action: ModuleAction;
}

export const RequirePermission = (module: AppModule, action: ModuleAction) =>
  SetMetadata(PERMISSION_KEY, { module, action });
