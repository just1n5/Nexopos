import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index
} from 'typeorm';
import { Sale } from './sale.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  NEQUI = 'NEQUI',
  DAVIPLATA = 'DAVIPLATA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT', // Para fiado
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

@Entity('payments')
@Index(['saleId'])
@Index(['method'])
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  saleId: string;

  @ManyToOne(() => Sale, sale => sale.payments, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  // For cash payments
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  receivedAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  changeGiven: number;

  // Transaction reference (for electronic payments)
  @Column({ nullable: true })
  transactionRef: string;

  // For Nequi/Daviplata - store QR code data
  @Column({ nullable: true, type: 'text' })
  qrCodeData: string;

  // Notes
  @Column({ nullable: true, length: 255 })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  // User who processed the payment (for audit)
  @Column({ nullable: true })
  processedBy: string;

  // Additional fields
  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;
}
