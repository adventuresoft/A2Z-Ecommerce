import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsAdminController } from './shipments.admin.controller.js';
import { ShippingZonesAdminController } from './shipping-zones.admin.controller.js';
import { ShippingMethodsAdminController } from './shipping-methods.admin.controller.js';
import { ShipmentsService } from './shipments.service.js';

@Module({
  imports: [PrismaModule, AuthModule, InventoryModule],
  controllers: [
    ShipmentsController,
    ShipmentsAdminController,
    ShippingZonesAdminController,
    ShippingMethodsAdminController,
  ],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
