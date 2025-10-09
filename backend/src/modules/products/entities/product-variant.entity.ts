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

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE'
  })
  product: Product;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
