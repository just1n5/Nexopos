import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '../inventory/entities/inventory-movement.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantsRepository: Repository<ProductVariant>,
    @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      variants: createProductDto.variants?.map((variant) => this.variantsRepository.create(variant)) ?? []
    });

    const savedProduct = await this.productsRepository.save(product);

    // Register initial stock in inventory for each variant
    if (savedProduct.variants && savedProduct.variants.length > 0) {
      for (const variant of savedProduct.variants) {
        const stockValue = variant.stock || 0;
        if (stockValue > 0) {
          try {
            await this.inventoryService.adjustStock(
              savedProduct.id,
              stockValue,
              MovementType.ADJUSTMENT,
              'system', // userId
              {
                variantId: variant.id,
                unitCost: Number(variant.price || savedProduct.basePrice || 0),
                reason: 'Initial stock',
                notes: `Initial stock for variant ${variant.name || variant.sku}`
              }
            );
          } catch (error) {
            console.error(`Failed to register initial stock for variant ${variant.id}:`, error);
            // Continue with other variants even if one fails
          }
        }
      }
    } else {
      // If no variants, register stock for the main product
      const stockValue = createProductDto.stock || 0;
      if (stockValue > 0) {
        try {
          await this.inventoryService.adjustStock(
            savedProduct.id,
            stockValue,
            MovementType.ADJUSTMENT,
            'system',
            {
              unitCost: Number(savedProduct.basePrice || 0),
              reason: 'Initial stock',
              notes: `Initial stock for product ${savedProduct.name}`
            }
          );
        } catch (error) {
          console.error(`Failed to register initial stock for product ${savedProduct.id}:`, error);
        }
      }
    }

    return savedProduct;
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
