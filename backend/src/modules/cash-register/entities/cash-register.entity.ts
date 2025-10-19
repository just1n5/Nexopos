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
import { CashMovement } from './cash-movement.entity';

export enum CashRegisterStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
  RECONCILED = 'RECONCILED'
}

@Entity('cash_registers')
@Index(['userId', 'status'])
@Index(['openedAt'])
@Index(['closedAt'])
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionNumber: string; // CASH-2024-00001

  @Column()
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  @Column({ nullable: true })
  terminalId: string; // For multi-terminal support

  @Column({
    type: 'enum',
    enum: CashRegisterStatus,
    default: CashRegisterStatus.OPEN
  })
  status: CashRegisterStatus;

  // Opening details
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  openingBalance: number;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column()
  openedBy: string;

  // Closing details
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingCashAmount: number; // Physical cash amount at closing

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedClosingBalance: number; // Expected balance at closing

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  discrepancy: number; // Difference between expected and actual

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  closedBy: string;

  // Transaction summary
  @Column({ type: 'int', default: 0 })
  totalTransactions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCashSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCardSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDigitalSales: number; // Nequi, Daviplata, etc.

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCreditSales: number; // Fiado

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalOtherSales: number; // Other payment methods

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRefunds: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalExpenses: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeposits: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalWithdrawals: number;

  // Physical cash count (for reconciliation)
  @Column({ type: 'jsonb', nullable: true })
  cashCount: {
    bills: {
      [denomination: string]: number; // e.g., { "100000": 5, "50000": 10 }
    };
    coins: {
      [denomination: string]: number; // e.g., { "1000": 20, "500": 15 }
    };
  };

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCounted: number;

  // Notes and metadata
  @Column({ type: 'text', nullable: true })
  openingNotes: string;

  @Column({ type: 'text', nullable: true })
  closingNotes: string;

  @Column({ type: 'text', nullable: true })
  discrepancyReason: string;

  // Accounting integration
  /**
   * Relación con el asiento contable generado al cerrar la caja
   * Se crea al confirmar el cierre del arqueo
   */
  @Column({ type: 'uuid', nullable: true })
  journalEntryId: string;

  // Relationships
  @OneToMany(() => CashMovement, movement => movement.cashRegister)
  movements: CashMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
