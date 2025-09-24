import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Sale } from './sale.entity';

@Entity('sale_items')
@Index(['saleId', 'productId'])
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  saleId: string;

  @ManyToOne(() => Sale, sale => sale.items, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  // Product reference
  @Column()
  productId: string;

  @Column({ nullable: true })
  productVariantId: string;

  // Product snapshot at time of sale (denormalized for history)
  @Column()
  productName: string;

  @Column()
  productSku: string;

  @Column({ nullable: true })
  variantName: string; // e.g., "Talla M - Color Azul"

  // Quantity and pricing
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  costPrice: number; // For profit calculation

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  // Tax information
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ nullable: true })
  taxCode: string; // IVA, INC, etc.

  // Calculated fields
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  // Notes
  @Column({ nullable: true, length: 255 })
  notes: string;
}
