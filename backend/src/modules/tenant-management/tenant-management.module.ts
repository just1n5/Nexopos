import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantManagementController } from './tenant-management.controller';
import { TenantManagementService } from './tenant-management.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { OtpModule } from '../otp/otp.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User]),
    OtpModule,
    EmailModule,
  ],
  controllers: [TenantManagementController],
  providers: [TenantManagementService],
})
export class TenantManagementModule {}
