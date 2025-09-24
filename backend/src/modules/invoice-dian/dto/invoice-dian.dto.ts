import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType } from '../entities/invoice-dian.entity';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Sale ID to generate invoice from' })
  @IsNotEmpty()
  @IsString()
  saleId: string;

  @ApiProperty({ enum: InvoiceType, default: InvoiceType.POS })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Customer NIT/CC' })
  @IsOptional()
  @IsString()
  customerNit?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class CreateResolutionDto {
  @ApiProperty({ description: 'DIAN Resolution number' })
  @IsNotEmpty()
  @IsString()
  resolutionNumber: string;

  @ApiProperty({ description: 'Resolution date' })
  @IsNotEmpty()
  @IsDateString()
  resolutionDate: string;

  @ApiProperty({ description: 'Valid from date' })
  @IsNotEmpty()
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid until date' })
  @IsNotEmpty()
  @IsDateString()
  validUntil: string;

  @ApiProperty({ description: 'Invoice prefix (SETP, POS, etc)' })
  @IsNotEmpty()
  @IsString()
  prefix: string;

  @ApiProperty({ description: 'Range from' })
  @IsNotEmpty()
  @IsNumber()
  rangeFrom: number;

  @ApiProperty({ description: 'Range to' })
  @IsNotEmpty()
  @IsNumber()
  rangeTo: number;

  @ApiProperty({ description: 'Technical key' })
  @IsNotEmpty()
  @IsString()
  technicalKey: string;

  @ApiPropertyOptional({ description: 'Test set ID for test environment' })
  @IsOptional()
  @IsString()
  testSetId?: string;

  @ApiPropertyOptional({ description: 'Alert threshold' })
  @IsOptional()
  @IsNumber()
  alertThreshold?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResendInvoiceDto {
  @ApiPropertyOptional({ description: 'Email to send invoice to' })
  @IsOptional()
  @IsString()
  email?: string;
}

export class CancelInvoiceDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'User who cancelled the invoice' })
  @IsOptional()
  @IsString()
  cancelledBy?: string;
}

export class TestDianConnectionDto {
  @ApiProperty({ description: 'NIT to test' })
  @IsNotEmpty()
  @IsString()
  nit: string;

  @ApiPropertyOptional({ description: 'Test in production environment' })
  @IsOptional()
  testProduction?: boolean;
}

export class GenerateCufeDto {
  @ApiProperty({ description: 'Invoice number' })
  @IsNotEmpty()
  @IsNumber()
  invoiceNumber: number;

  @ApiProperty({ description: 'Invoice date' })
  @IsNotEmpty()
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ description: 'Subtotal' })
  @IsNotEmpty()
  @IsNumber()
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  @IsNotEmpty()
  @IsNumber()
  taxAmount: number;

  @ApiProperty({ description: 'Total' })
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Company NIT' })
  @IsNotEmpty()
  @IsString()
  companyNit: string;

  @ApiProperty({ description: 'Customer NIT' })
  @IsNotEmpty()
  @IsString()
  customerNit: string;

  @ApiProperty({ description: 'Technical key' })
  @IsNotEmpty()
  @IsString()
  technicalKey: string;
}
