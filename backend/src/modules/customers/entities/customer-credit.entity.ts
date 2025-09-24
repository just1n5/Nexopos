import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Customer } from './customer.entity';

export enum CreditType {
  SALE = 'sale',           // Credit from a sale
  PAYMENT = 'payment',     // Payment received
  ADJUSTMENT = 'adjustment', // Manual adjustment
  RETURN = 'return'        // Return/refund
}

export enum CreditStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

@Entity('customer_credits')
@Index(['customerId'])
@Index(['type'])
@Index(['status'])
@Index(['dueDate'])
@Index(['referenceType', 'referenceId'])
export class CustomerCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'enum', enum: CreditType })
  type: CreditType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string; // 'sale', 'manual', etc.

  @Column({ type: 'uuid', nullable: true })
  referenceId: string; // Sale ID or other reference

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceNumber: string; // Sale number or other reference

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({ type: 'enum', enum: CreditStatus, default: CreditStatus.PENDING })
  status: CreditStatus;

  @Column({ type: 'int', default: 0 })
  daysOverdue: number;

  @Column({ type: 'int', default: 0 })
  remindersSent: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReminderDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @ManyToOne(() => Customer, customer => customer.credits)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isPaid(): boolean {
    return this.status === CreditStatus.PAID;
  }

  get isOverdue(): boolean {
    if (this.isPaid) return false;
    if (!this.dueDate) return false;
    return new Date() > new Date(this.dueDate);
  }

  updateBalance(): void {
    this.balance = Math.max(0, this.amount - this.paidAmount);
    
    if (this.balance === 0) {
      this.status = CreditStatus.PAID;
      if (!this.paidDate) {
        this.paidDate = new Date();
      }
    } else if (this.paidAmount > 0) {
      this.status = CreditStatus.PARTIAL;
    }

    // Update overdue status
    if (this.isOverdue && !this.isPaid) {
      this.status = CreditStatus.OVERDUE;
      const now = new Date();
      const due = new Date(this.dueDate);
      const diffTime = Math.abs(now.getTime() - due.getTime());
      this.daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }
}
