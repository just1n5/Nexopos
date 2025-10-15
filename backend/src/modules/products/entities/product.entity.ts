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

  @Column('decimal', { precision: 12, scale: 2 })
  basePrice: number;

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

  // Multi-tenancy: cada producto pertenece a un tenant específico
  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

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
