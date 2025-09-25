import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum CreditPaymentMethodDto {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CARD = 'card',
  OTHER = 'other',
}

export class CreateCreditPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(CreditPaymentMethodDto)
  paymentMethod: CreditPaymentMethodDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;
}
