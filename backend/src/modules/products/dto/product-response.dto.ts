import { Product } from '../entities/product.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantResponseDto } from './product-variant-response.dto';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

export class ProductResponseDto extends Product {
  @ApiPropertyOptional({ description: 'Current stock quantity of the product (if no variants)' })
  stock?: number;

  @ApiProperty({ type: [ProductVariantResponseDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantResponseDto)
  variants: ProductVariantResponseDto[];
}
