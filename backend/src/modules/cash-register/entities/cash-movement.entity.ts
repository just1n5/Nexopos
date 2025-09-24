import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn
} from 'typeorm';
import { CashRegister } from './cash-register.entity';
import { CashRegisterSession } from './cash-register-session.entity';

export enum MovementType {
  SALE = 'SALE',
  REFUND = 'REFUND',
  RETURN = 'RETURN',
  EXPENSE = 'EXPENSE',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ADJUSTMENT = 'ADJUSTMENT',
  OPENING = 'OPENING',
  CLOSING = 'CLOSING'
}

export enum MovementCategory {
  // Income
  SALES_INCOME = 'SALES_INCOME',
  OTHER_INCOME = 'OTHER_INCOME',
  
  // Expenses
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SALARIES = 'SALARIES',
  MAINTENANCE = 'MAINTENANCE',
  SUPPLIES = 'SUPPLIES',
  TRANSPORT = 'TRANSPORT',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
  
  // Adjustments
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
  CORRECTION = 'CORRECTION',
  
  // System
  SYSTEM = 'SYSTEM'
}

@Entity('cash_movements')
@Index(['cashRegisterId'])
@Index(['type'])
@Index(['createdAt'])
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cashRegisterId: string;

  @ManyToOne(() => CashRegister, cashRegister => cashRegister.movements)
  @JoinColumn({ name: 'cashRegisterId' })
  cashRegister: CashRegister;

  // Removed session relationship - using cashRegister instead

  @Column({
    type: 'enum',
    enum: MovementType
  })
  type: MovementType;

  @Column({
    type: 'enum',
    enum: MovementCategory,
    nullable: true
  })
  category: MovementCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number;

  // Reference to related entities
  @Column({ nullable: true })
  referenceType: string; // Type of reference (sale, refund, expense, etc.)

  @Column({ nullable: true })
  referenceId: string; // ID of the referenced entity

  @Column({ nullable: true })
  saleId: string;

  @Column({ nullable: true })
  refundId: string;

  @Column({ nullable: true })
  expenseId: string;

  // Payment method (for sales/refunds)
  @Column({ nullable: true })
  paymentMethod: string;

  // Description and notes
  @Column()
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Receipt/Document info
  @Column({ nullable: true })
  documentNumber: string;

  @Column({ nullable: true })
  documentType: string;

  // Who performed the movement
  @Column()
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  // For expense categorization
  @Column({ nullable: true })
  supplierName: string;

  @Column({ nullable: true })
  supplierNit: string;

  // Approval (for expenses/withdrawals)
  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
