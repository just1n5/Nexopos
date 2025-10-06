import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn
} from 'typeorm';
import { SaleItem } from './sale-item.entity';
import { Payment } from './payment.entity';

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum SaleType {
  REGULAR = 'REGULAR',
  CREDIT = 'CREDIT' // Para manejar ventas fiadas
}

@Entity('sales')
@Index(['saleNumber'])
@Index(['createdAt'])
@Index(['status'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  saleNumber: string; // Ej: POS-2024-00001

  @Column({
    type: 'enum',
    enum: SaleType,
    default: SaleType.REGULAR
  })
  type: SaleType;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDING
  })
  status: SaleStatus;

  // Customer relationship (nullable for anonymous sales)
  @Column({ nullable: true })
  customerId: string;

  @ManyToOne('Customer', { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: any;

  // User who made the sale
  @Column()
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  // Cash register session (if applicable)
  @Column({ nullable: true })
  cashRegisterId: string;

  // Financial details
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  changeAmount: number;

  // For credit sales (fiado)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditAmount: number;

  @Column({ nullable: true })
  creditDueDate: Date;

  @Column({ nullable: true })
  creditPaidDate: Date;

  // Additional status fields
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ nullable: true, length: 500 })
  cancellationReason: string;

  @Column({ type: 'boolean', default: false })
  requiresInvoice: boolean;

  // Notes and metadata
  @Column({ nullable: true, length: 500 })
  notes: string;

  // Invoice reference (when DIAN invoice is generated)
  @Column({ nullable: true })
  invoiceId: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  // Relationships
  @OneToMany(() => SaleItem, saleItem => saleItem.sale, {
    cascade: true,
    eager: true
  })
  items: SaleItem[];

  @OneToMany(() => Payment, payment => payment.sale, {
    cascade: true,
    eager: true
  })
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isPaid(): boolean {
    return Number(this.paidAmount || 0) >= Number(this.total || 0);
  }

  get pendingAmount(): number {
    return Math.max(0, Number(this.total || 0) - Number(this.paidAmount || 0));
  }
}
