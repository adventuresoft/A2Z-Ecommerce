import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validate } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/index.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { BrandsModule } from './brands/brands.module.js';
import { AttributesModule } from './attributes/attributes.module.js';
import { ProductsModule } from './products/products.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { TaxesModule } from './taxes/taxes.module.js';
import { AccountModule } from './account/account.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { WishlistModule } from './wishlist/wishlist.module.js';
import { TagsModule } from './tags/tags.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AccountModule,
    CategoriesModule,
    BrandsModule,
    AttributesModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    ShipmentsModule,
    SettingsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
    ReportsModule,
    CustomersModule,
    AuditLogsModule,
    TaxesModule,
    CouponsModule,
    CheckoutModule,
    WishlistModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


