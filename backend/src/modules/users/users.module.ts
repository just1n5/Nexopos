import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserAuditLog } from './entities/user-audit.entity';
import { RolesGuard } from './guards/roles.guard';
import { UserAuditService } from './services/user-audit.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, UserAuditLog])],
  controllers: [UsersController],
  providers: [UsersService, UserAuditService, RolesGuard],
  exports: [UsersService, UserAuditService, TypeOrmModule]
})
export class UsersModule {}
