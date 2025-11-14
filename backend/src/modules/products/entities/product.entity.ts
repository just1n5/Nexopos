import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum ProductSaleType {
  UNIT = 'UNIT',
  WEIGHT = 'WEIGHT'
}

export enum WeightUnit {
  GRAM = 'GRAM',
  KILO = 'KILO',
  POUND = 'POUND'
}

@Entity('products')
@Index(['tenantId', 'sku'], { unique: true }) // SKU único por tenant
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ length: 80 })
  sku: string;

  @Column({ length: 80, nullable: true })
  barcode?: string;

  @Column({ length: 500, nullable: true })
  imageUrl?: string;

  @Column('decimal', { precision: 12, scale: 2 })
  basePrice: number;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.products, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  // Tipo de venta: por unidad o por peso
  @Column({ 
    name: 'sale_type',
    type: 'enum', 
    enum: ProductSaleType, 
    default: ProductSaleType.UNIT 
  })
  saleType: ProductSaleType;

  // Precio por gramo (solo para productos vendidos por peso)
  @Column('decimal', {
    name: 'price_per_gram',
    precision: 12,
    scale: 4,
    nullable: true
  })
  pricePerGram?: number;

  // Porcentaje de IVA (19, 5, 0 para exento)
  @Column('decimal', {
    precision: 5,
    scale: 2,
    nullable: true,
    default: 19.00
  })
  tax?: number;

  // Costo unitario (para productos vendidos por unidad)
  @Column('decimal', {
    name: 'unit_cost',
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0
  })
  unitCost?: number;

  // Costo por gramo (para productos vendidos por peso)
  @Column('decimal', {
    name: 'cost_per_gram',
    precision: 12,
    scale: 4,
    nullable: true,
    default: 0
  })
  costPerGram?: number;

  // Unidad de peso para entrada de costo (el sistema siempre convierte a gramos internamente)
  @Column({
    name: 'weight_unit',
    type: 'enum',
    enum: WeightUnit,
    nullable: true
  })
  weightUnit?: WeightUnit;



  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
    eager: true
  })
  variants: ProductVariant[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
