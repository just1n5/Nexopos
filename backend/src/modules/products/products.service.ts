import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantsRepository: Repository<ProductVariant>
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      variants: createProductDto.variants?.map((variant) => this.variantsRepository.create(variant)) ?? []
    });

    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const { variants, ...rest } = updateProductDto;
    Object.assign(product, rest);

    if (variants) {
      product.variants = await this.mergeVariants(product, variants);
    }

    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    await this.productsRepository.remove(product);
  }

  private async mergeVariants(product: Product, variantsDto: UpdateProductVariantDto[]): Promise<ProductVariant[]> {
    const existingVariants = await this.variantsRepository.find({ where: { product: { id: product.id } } });
    const existingVariantsMap = new Map(existingVariants.map((variant) => [variant.id, variant]));

    const variantsToKeep: ProductVariant[] = [];

    for (const variantDto of variantsDto) {
      if (variantDto.id) {
        const existing = existingVariantsMap.get(variantDto.id);
        if (!existing) {
          throw new NotFoundException(`Variant ${variantDto.id} does not exist for this product.`);
        }
        const { id, ...rest } = variantDto;
        Object.assign(existing, rest);
        variantsToKeep.push(existing);
        existingVariantsMap.delete(variantDto.id);
      } else {
        const created = this.variantsRepository.create({ ...variantDto, product });
        variantsToKeep.push(created);
      }
    }

    if (existingVariantsMap.size) {
      const orphanIds = Array.from(existingVariantsMap.keys());
      await this.variantsRepository.delete({ id: In(orphanIds) });
    }

    return variantsToKeep;
  }
}
