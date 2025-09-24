import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsArray, ValidateNested, IsUUID, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';
import { SaleType } from '../entities/sale.entity';

export class CreateSaleItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ description: 'Quantity', minimum: 0.001 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Notes for this item' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Payment amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Amount received (for cash payments)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedAmount?: number;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: SaleType, default: SaleType.REGULAR })
  @IsOptional()
  @IsEnum(SaleType)
  type?: SaleType;

  @ApiProperty({ type: [CreateSaleItemDto], description: 'Sale items' })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({ type: [CreatePaymentDto], description: 'Payment methods' })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments: CreatePaymentDto[];

  @ApiPropertyOptional({ description: 'Overall discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Overall discount percentage', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Notes for the sale' })
  @IsOptional()
  @IsString()
  notes?: string;

  // For credit sales (fiado)
  @ApiPropertyOptional({ description: 'Credit due date (for credit sales)' })
  @IsOptional()
  @IsDateString()
  creditDueDate?: string;
}

// DTO for quick sales (simplified)
export class QuickSaleDto {
  @ApiProperty({ description: 'Product barcode or SKU' })
  @IsNotEmpty()
  @IsString()
  productCode: string;

  @ApiPropertyOptional({ description: 'Quantity', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Amount received (for cash)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedAmount?: number;
}

// DTO for calculating sale totals
export class CalculateSaleDto {
  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}
