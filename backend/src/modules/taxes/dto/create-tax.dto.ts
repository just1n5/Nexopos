import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Length, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxType } from '../entities/tax.entity';

export class CreateTaxDto {
  @ApiProperty({ description: 'Tax name', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Tax description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  type: TaxType;

  @ApiProperty({ description: 'Tax rate (percentage)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiPropertyOptional({ description: 'Is tax active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is default tax', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Tax code for DIAN', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  code?: string;
}