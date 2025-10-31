import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
import { ScheduledTasksModule } from './modules/scheduled-tasks/scheduled-tasks.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..' , 'frontend', 'dist'),
      exclude: ['/api*'],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: {
              rejectUnauthorized: false,
            },
            autoLoadEntities: true,
            synchronize: configService.get<string>('DB_SYNC', 'false') === 'true',
            logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
          };
        } else {
          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            database: configService.get<string>('DB_NAME', 'nexopos'),
            username: configService.get<string>('DB_USER', 'nexopos_user'),
            password: configService.get<string>('DB_PASSWORD', 'nexopos123'),
            autoLoadEntities: true,
            synchronize: configService.get<string>('DB_SYNC', 'false') === 'true',
            logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
          };
        }
      },
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    BetaKeysModule,
    TenantsModule,
    ProductsModule,
    CategoriesModule,
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
    ScheduledTasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
