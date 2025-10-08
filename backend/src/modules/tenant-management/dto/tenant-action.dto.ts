import { IsString, IsUUID, IsNotEmpty, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ description: 'ID del tenant a modificar' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: 'Email del SUPER_ADMIN para enviar OTP' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'ID del tenant a modificar' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: 'Código OTP de 6 dígitos' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @IsNotEmpty()
  otpCode: string;

  @ApiProperty({ description: 'Email del SUPER_ADMIN' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
