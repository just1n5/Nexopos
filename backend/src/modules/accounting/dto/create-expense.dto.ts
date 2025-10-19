import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsBoolean, Min } from 'class-validator';
import { ExpenseType, PaymentMethod } from '../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Tipo de gasto',
    enum: ExpenseType,
    example: ExpenseType.UTILITIES
  })
  @IsEnum(ExpenseType)
  @IsNotEmpty()
  type: ExpenseType;

  @ApiProperty({
    description: 'Fecha del gasto (fecha de la factura)',
    example: '2024-01-15'
  })
  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;

  @ApiProperty({
    description: 'Nombre del proveedor',
    example: 'EPM',
    required: false
  })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiProperty({
    description: 'NIT del proveedor',
    example: '890900608-1',
    required: false
  })
  @IsString()
  @IsOptional()
  supplierNit?: string;

  @ApiProperty({
    description: 'Número de factura del proveedor',
    example: 'FV-12345',
    required: false
  })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiProperty({
    description: 'Subtotal (base gravable, sin IVA)',
    example: 200000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  subtotal: number;

  @ApiProperty({
    description: 'IVA descontable',
    example: 38000,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({
    description: 'Total del gasto (subtotal + IVA)',
    example: 238000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  total: number;

  @ApiProperty({
    description: 'Método de pago utilizado',
    enum: PaymentMethod,
    example: PaymentMethod.BANK
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Fecha de pago (si ya fue pagado)',
    example: '2024-01-15',
    required: false
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiProperty({
    description: 'Descripción o notas del gasto',
    example: 'Pago de energía eléctrica - Enero 2024',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL de la imagen de la factura',
    required: false
  })
  @IsString()
  @IsOptional()
  invoiceImageUrl?: string;

  @ApiProperty({
    description: 'Datos extraídos por OCR',
    required: false
  })
  @IsOptional()
  ocrData?: any;

  @ApiProperty({
    description: 'Indica si los datos fueron extraídos por OCR',
    default: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isOcrExtracted?: boolean;
}
