import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';

export enum MovementType {
  INITIAL = 'INITIAL', // Initial stock
  PURCHASE = 'PURCHASE', // Purchase from supplier
  SALE = 'SALE', // Sale to customer
  RETURN_CUSTOMER = 'RETURN_CUSTOMER', // Return from customer
  RETURN_SUPPLIER = 'RETURN_SUPPLIER', // Return to supplier
  ADJUSTMENT = 'ADJUSTMENT', // Manual adjustment
  TRANSFER_IN = 'TRANSFER_IN', // Transfer from another location
  TRANSFER_OUT = 'TRANSFER_OUT', // Transfer to another location
  DAMAGE = 'DAMAGE', // Damaged goods
  EXPIRY = 'EXPIRY' // Expired goods
}

@Entity('inventory_movements')
@Index(['productId'])
@Index(['productVariantId'])
@Index(['type'])
@Index(['createdAt'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productVariantId: string;

  @Column({
    type: 'enum',
    enum: MovementType
  })
  type: MovementType;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number; // Positive for IN, Negative for OUT

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantityBefore: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantityAfter: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCost: number;

  // Reference information
  @Column({ nullable: true })
  referenceType: string; // 'sale', 'purchase', etc.

  @Column({ nullable: true })
  referenceId: string; // ID of related record

  @Column({ nullable: true })
  referenceNumber: string; // Invoice number, PO number, etc.

  // Batch/Lot tracking
  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  expiryDate: Date;

  // Location tracking
  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  warehouseName: string;

  @Column({ nullable: true })
  locationId: string;

  @Column({ nullable: true })
  locationName: string;

  // Notes and metadata
  @Column({ nullable: true, length: 500 })
  notes: string;

  @Column({ nullable: true })
  reason: string; // For adjustments

  // User tracking
  @Column({ nullable: true })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
