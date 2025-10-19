import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
@Index(['sku'], { unique: true })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 80 })
  sku: string;

  @Column({ length: 80, nullable: true })
  barcode?: string;

  @Column({ length: 40, nullable: true })
  size?: string;

  @Column({ length: 40, nullable: true })
  color?: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  priceDelta: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  /**
   * Tarifa de IVA aplicable (0, 5, 19)
   * 0 = Exento, 5 = Reducido, 19 = General
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 19 })
  taxRate: number;

  /**
   * Indica si el precio incluye el IVA
   * true = precio con IVA incluido
   * false = precio sin IVA (se suma al total)
   */
  @Column({ type: 'boolean', default: true })
  taxIncluded: boolean;

  /**
   * Indica si el producto está excluido de IVA
   * Productos excluidos no generan IVA y no permiten descuento
   */
  @Column({ type: 'boolean', default: false })
  isTaxExcluded: boolean;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE'
  })
  product: Product;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
