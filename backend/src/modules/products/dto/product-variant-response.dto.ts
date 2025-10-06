import { ProductVariant } from '../entities/product-variant.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ProductVariantResponseDto extends ProductVariant {
  @ApiProperty({ description: 'Current stock quantity of the variant' })
  stock: number;
}
