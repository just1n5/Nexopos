import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class UpdateProductVariantDto extends PartialType(CreateProductVariantDto) {
  @IsOptional()
  @IsUUID()
  id?: string;
}
