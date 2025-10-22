import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique
} from 'typeorm';

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  RESERVED = 'RESERVED'
}

@Entity('inventory_stock')
@Unique(['productId', 'productVariantId', 'warehouseId', 'batchNumber'])
@Index(['productId'])
@Index(['productVariantId'])
@Index(['warehouseId'])
@Index(['status'])
export class InventoryStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productVariantId: string;

  // Current quantities
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  availableQuantity: number; // quantity - reservedQuantity

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  reservedQuantity: number;

  // Stock levels
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  minStockLevel: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  maxStockLevel: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  reorderPoint: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  reorderQuantity: number;

  @Column({
    type: 'enum',
    enum: StockStatus,
    default: StockStatus.IN_STOCK
  })
  status: StockStatus;

  // Cost information
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  averageCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lastCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalValue: number; // quantity * averageCost

  // Batch/Lot information
  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  manufacturingDate: Date;

  // Location information
  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ nullable: true })
  bin: string; // Specific bin/shelf location

  // Tracking
  @Column({ nullable: true })
  lastMovementId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMovementDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastCountDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  lastCountQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isLowStock(): boolean {
    return this.quantity <= this.minStockLevel;
  }

  get needsReorder(): boolean {
    return this.quantity <= this.reorderPoint;
  }

  get isExpired(): boolean {
    return this.expiryDate ? new Date() > new Date(this.expiryDate) : false;
  }

  get daysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    const diff = new Date(this.expiryDate).getTime() - new Date().getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
