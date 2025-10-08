import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { BetaKeysModule } from '../beta-keys/beta-keys.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailModule } from '../email/email.module';
import { OtpModule } from '../otp/otp.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    BetaKeysModule,
    TenantsModule,
    EmailModule,
    OtpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'change-me'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '3600s') }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule]
})
export class AuthModule {}
