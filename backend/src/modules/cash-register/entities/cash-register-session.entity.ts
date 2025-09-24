import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { CashMovement } from './cash-movement.entity';
import { CashCount } from './cash-count.entity';

export enum CashRegisterStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED'
}

@Entity('cash_register_sessions')
@Index(['status'])
@Index(['userId'])
@Index(['openedAt'])
@Index(['closedAt'])
export class CashRegisterSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionNumber: string; // CASH-2024-00001

  @Column({
    type: 'enum',
    enum: CashRegisterStatus,
    default: CashRegisterStatus.OPEN
  })
  status: CashRegisterStatus;

  // User who opened the cash register
  @Column()
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  // Opening data
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  openingBalance: number;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ nullable: true })
  openedBy: string;

  @Column({ nullable: true, length: 500 })
  openingNotes: string;

  // Closing data
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingBalance: number;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ nullable: true, length: 500 })
  closingNotes: string;

  // Expected vs Actual (for discrepancy tracking)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  expectedCash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  actualCash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashDifference: number; // actualCash - expectedCash

  // Sales summary
  @Column({ type: 'int', default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSalesAmount: number;

  // Payment method breakdown
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cardSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  digitalSales: number; // Nequi, Daviplata, etc.

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditSales: number; // Fiado

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherSales: number;

  // Cash movements summary
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCashIn: number; // Additional cash added

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCashOut: number; // Cash withdrawn

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalExpenses: number; // Expenses paid from cash

  // Terminal/POS information
  @Column({ nullable: true })
  terminalId: string;

  @Column({ nullable: true })
  terminalName: string;

  // Location information
  @Column({ nullable: true })
  storeId: string;

  @Column({ nullable: true })
  storeName: string;

  // Relationships
  // Movements are now related to CashRegister entity instead

  @OneToMany(() => CashCount, count => count.session, {
    cascade: true
  })
  cashCounts: CashCount[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isOpen(): boolean {
    return this.status === CashRegisterStatus.OPEN;
  }

  get duration(): number {
    if (!this.closedAt) return 0;
    return this.closedAt.getTime() - this.openedAt.getTime();
  }
}
