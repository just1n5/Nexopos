import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BetaKeysModule } from './modules/beta-keys/beta-keys.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { SalesModule } from './modules/sales/sales.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { CreditsModule } from './modules/credits/credits.module';
import { ReportsModule } from './modules/reports/reports.module';
import { OtpModule } from './modules/otp/otp.module';
import { EmailModule } from './modules/email/email.module';
import { TenantManagementModule } from './modules/tenant-management/tenant-management.module';
import { AccountingModule } from './modules/accounting/accounting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        database: config.get<string>('DB_NAME', 'nexopos'),
        username: config.get<string>('DB_USER', 'nexopos_user'),
        password: config.get<string>('DB_PASSWORD', 'nexopos123'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    BetaKeysModule,
    TenantsModule,
    ProductsModule,
    CategoriesModule,
    CustomersModule,
    InventoryModule,
    CashRegisterModule,
    SalesModule,
    IntegrationModule,
    TaxesModule,
    CreditsModule,
    ReportsModule,
    OtpModule,
    EmailModule,
    TenantManagementModule,
    AccountingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
