import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  Length
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerType, default: CustomerType.INDIVIDUAL })
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @ApiProperty({ example: 'CC', description: 'Document type (CC, CE, NIT, etc.)' })
  @IsString()
  @Length(2, 20)
  documentType: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @Length(5, 20)
  documentNumber: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @Length(2, 100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Mi Empresa S.A.S' })
  @IsString()
  @IsOptional()
  @Length(2, 200)
  businessName?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '6012345678' })
  @IsString()
  @IsOptional()
  @Length(7, 20)
  phone?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsString()
  @IsOptional()
  @Length(10, 20)
  mobile?: string;

  @ApiPropertyOptional({ example: 'Calle 123 #45-67' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Cundinamarca' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '110111' })
  @IsString()
  @IsOptional()
  @Length(4, 10)
  postalCode?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  // Credit/Fiado Configuration
  @ApiPropertyOptional({ 
    example: true, 
    description: 'Enable credit for this customer' 
  })
  @IsBoolean()
  @IsOptional()
  creditEnabled?: boolean;

  @ApiPropertyOptional({ 
    example: 500000, 
    description: 'Credit limit in COP' 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100000000)
  creditLimit?: number;

  @ApiPropertyOptional({ 
    example: 30, 
    description: 'Default payment terms in days' 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(365)
  creditDays?: number;

  @ApiPropertyOptional({ 
    example: '3001234567', 
    description: 'WhatsApp number for reminders' 
  })
  @IsString()
  @IsOptional()
  @Length(10, 20)
  whatsapp?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  acceptsMarketing?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  acceptsReminders?: boolean;

  @ApiPropertyOptional({ example: 'VIP customer, handle with care' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCustomerDto extends CreateCustomerDto {}
