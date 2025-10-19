import { ApiProperty } from '@nestjs/swagger';
import { ExpenseType, ExpenseStatus, PaymentMethod } from '../entities/expense.entity';

export class ExpenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  expenseNumber: string;

  @ApiProperty({ enum: ExpenseType })
  type: ExpenseType;

  @ApiProperty({ enum: ExpenseStatus })
  status: ExpenseStatus;

  @ApiProperty()
  expenseDate: Date;

  @ApiProperty({ required: false })
  supplierName?: string;

  @ApiProperty({ required: false })
  supplierNit?: string;

  @ApiProperty({ required: false })
  invoiceNumber?: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  paymentDate?: Date;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  invoiceImageUrl?: string;

  @ApiProperty()
  isOcrExtracted: boolean;

  @ApiProperty({ required: false })
  journalEntryId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Campos calculados
  @ApiProperty({
    description: 'Ícono emoji del tipo de gasto',
    example: '💡'
  })
  icon: string;

  @ApiProperty({
    description: 'Código PUC de la cuenta de gasto',
    example: '5135'
  })
  pucCode: string;
}
