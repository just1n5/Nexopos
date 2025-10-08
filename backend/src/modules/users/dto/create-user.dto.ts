import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsBoolean, IsUUID } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsBoolean()
  isOwner?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}
