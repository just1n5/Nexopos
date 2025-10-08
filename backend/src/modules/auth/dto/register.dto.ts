import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '../../tenants/entities/tenant.entity';

export class RegisterDto {
  // Beta Key
  @ApiProperty({ example: 'BETA-ABC12-XYZ34' })
  @IsNotEmpty({ message: 'La clave beta es requerida' })
  @IsString()
  betaKey: string;

  // Datos del Negocio
  @ApiProperty({ example: 'Supermercado El Ahorro' })
  @IsNotEmpty({ message: 'El nombre del negocio es requerido' })
  @IsString()
  @MaxLength(200, { message: 'El nombre del negocio no puede exceder 200 caracteres' })
  businessName: string;

  @ApiProperty({ example: '900123456-7' })
  @IsNotEmpty({ message: 'El NIT es requerido' })
  @IsString()
  @MaxLength(50, { message: 'El NIT no puede exceder 50 caracteres' })
  nit: string;

  @ApiProperty({ enum: BusinessType, example: BusinessType.SUPERMERCADO })
  @IsNotEmpty({ message: 'El tipo de negocio es requerido' })
  @IsEnum(BusinessType, { message: 'Tipo de negocio inválido' })
  businessType: BusinessType;

  @ApiProperty({ example: 'Calle 123 # 45-67, Bogotá' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @IsString()
  address: string;

  @ApiProperty({ example: '3001234567' })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  businessPhone: string;

  @ApiProperty({ example: 'contacto@elahorro.com' })
  @IsNotEmpty({ message: 'El email del negocio es requerido' })
  @IsEmail({}, { message: 'Email del negocio inválido' })
  @MaxLength(100, { message: 'El email no puede exceder 100 caracteres' })
  businessEmail: string;

  // Datos del Usuario Admin
  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(60, { message: 'El nombre no puede exceder 60 caracteres' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
  @MaxLength(60, { message: 'El apellido no puede exceder 60 caracteres' })
  lastName: string;

  @ApiProperty({ example: 'juan.perez@gmail.com' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(120, { message: 'El email no puede exceder 120 caracteres' })
  email: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;

  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'El documento de identidad es requerido' })
  @IsString()
  @MaxLength(20, { message: 'El documento no puede exceder 20 caracteres' })
  documentId: string;

  @ApiProperty({ example: '3109876543' })
  @IsNotEmpty({ message: 'El teléfono personal es requerido' })
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  phoneNumber: string;
}
