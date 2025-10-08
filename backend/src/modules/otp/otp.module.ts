import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpCode } from './entities/otp.entity';
import { OtpService } from './otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode])],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
