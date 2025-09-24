import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { CustomerCredit } from './customer-credit.entity';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

@Entity('customers')
@Index(['documentType', 'documentNumber'], { unique: true })
@Index(['email'])
@Index(['phone'])
@Index(['status'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CustomerType, default: CustomerType.INDIVIDUAL })
  type: CustomerType;

  @Column({ type: 'varchar', length: 20 })
  documentType: string; // CC, CE, NIT, etc.

  @Column({ type: 'varchar', length: 20 })
  documentNumber: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  businessName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  // Credit/Fiado Management
  @Column({ type: 'boolean', default: false })
  creditEnabled: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditUsed: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditAvailable: number;

  @Column({ type: 'int', default: 30 })
  creditDays: number; // Default payment terms in days

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPurchases: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPayments: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number; // Current debt balance

  @Column({ type: 'int', default: 0 })
  purchaseCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPurchaseDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastPaymentDate: Date;

  // Loyalty Program
  @Column({ type: 'int', default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lifetimeValue: number;

  // WhatsApp for reminders
  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsapp: string;

  @Column({ type: 'boolean', default: true })
  acceptsMarketing: boolean;

  @Column({ type: 'boolean', default: true })
  acceptsReminders: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  // Relations
  @OneToMany(() => CustomerCredit, credit => credit.customer)
  credits: CustomerCredit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get fullName(): string {
    if (this.type === CustomerType.BUSINESS) {
      return this.businessName;
    }
    return `${this.firstName} ${this.lastName || ''}`.trim();
  }

  get hasCredit(): boolean {
    return this.creditEnabled && this.creditLimit > 0;
  }

  get isOverCreditLimit(): boolean {
    return this.creditUsed >= this.creditLimit;
  }

  get creditUtilization(): number {
    if (this.creditLimit === 0) return 0;
    return (this.creditUsed / this.creditLimit) * 100;
  }

  updateCreditAvailable(): void {
    this.creditAvailable = Math.max(0, this.creditLimit - this.creditUsed);
  }
}
