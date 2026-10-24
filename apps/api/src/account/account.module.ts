import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AccountService } from './account.service.js';
import { AccountController } from './account.controller.js';
import { AccountAddressesService } from './account-addresses.service.js';
import { AccountAddressesController } from './account-addresses.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AccountController, AccountAddressesController],
  providers: [AccountService, AccountAddressesService],
  exports: [AccountService, AccountAddressesService],
})
export class AccountModule {}
