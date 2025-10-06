import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsObject, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType, MovementCategory } from '../entities/cash-movement.entity';

export class OpenCashRegisterDto {
  @ApiProperty({ description: 'Opening balance amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @ApiPropertyOptional({ description: 'Terminal ID for multi-terminal support' })
  @IsOptional()
  @IsString()
  terminalId?: string;

  @ApiPropertyOptional({ description: 'Opening notes' })
  @IsOptional()
  @IsString()
  openingNotes?: string;
}

export class CashCountDto {
  @ApiProperty({ description: 'Bills denomination count', example: { "100000": 5, "50000": 10 } })
  @IsObject()
  bills: Record<string, number>;

  @ApiProperty({ description: 'Coins denomination count', example: { "1000": 20, "500": 15 } })
  @IsObject()
  coins: Record<string, number>;
}

export class CloseCashRegisterDto {
  @ApiPropertyOptional({ description: 'Actual cash counted', type: CashCountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CashCountDto)
  cashCount?: CashCountDto;

  @ApiPropertyOptional({ description: 'Total amount counted' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCounted?: number;

  @ApiPropertyOptional({ description: 'Actual amount counted (alternative to totalCounted)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualAmount?: number;

  @ApiPropertyOptional({ description: 'Closing notes' })
  @IsOptional()
  @IsString()
  closingNotes?: string;

  @ApiPropertyOptional({ description: 'Notes (alternative to closingNotes)' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Reason for discrepancy if any' })
  @IsOptional()
  @IsString()
  discrepancyReason?: string;
}

export class CreateMovementDto {
  @ApiProperty({ enum: MovementType, description: 'Movement type' })
  @IsNotEmpty()
  @IsEnum(MovementType)
  type: MovementType;

  @ApiPropertyOptional({ enum: MovementCategory, description: 'Movement category' })
  @IsOptional()
  @IsEnum(MovementCategory)
  category?: MovementCategory;

  @ApiProperty({ description: 'Movement amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Movement description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Document number' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Document type' })
  @IsOptional()
  @IsString()
  documentType?: string;

  // For expenses
  @ApiPropertyOptional({ description: 'Supplier name (for expenses)' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ description: 'Supplier NIT (for expenses)' })
  @IsOptional()
  @IsString()
  supplierNit?: string;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class CreateExpenseDto {
  @ApiPropertyOptional({ description: 'Expense category (string or enum)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Expense amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Expense description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ description: 'Supplier NIT' })
  @IsOptional()
  @IsString()
  supplierNit?: string;

  @ApiPropertyOptional({ description: 'Receipt/Invoice number' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CashAdjustmentDto {
  @ApiProperty({ description: 'Adjustment amount (positive for cash in, negative for cash out)' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CashRegisterSummaryDto {
  cashRegisterId: string;
  sessionNumber: string;
  status: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  currentBalance: number;
  totalSales: number;
  totalExpenses: number;
  totalCashSales: number;
  totalCardSales: number;
  totalDigitalSales: number;
  totalCreditSales: number;
  movements: number;
  salesByPaymentMethod?: Record<string, number>;
}
