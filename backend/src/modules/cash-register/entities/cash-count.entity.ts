import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { CashRegisterSession } from './cash-register-session.entity';

export enum DenominationType {
  BILL = 'BILL',
  COIN = 'COIN'
}

@Entity('cash_counts')
@Index(['sessionId'])
export class CashCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => CashRegisterSession, session => session.cashCounts, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'sessionId' })
  session: CashRegisterSession;

  @Column({
    type: 'enum',
    enum: DenominationType
  })
  type: DenominationType;

  // Denomination value (e.g., 100000 for 100k bill, 1000 for 1k coin)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  denomination: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number; // denomination * quantity

  // Additional info
  @Column({ nullable: true })
  currency: string; // COP by default

  @CreateDateColumn()
  createdAt: Date;

  // User who performed the count
  @Column()
  countedBy: string;
}

// Colombian Peso denominations helper
export const COP_DENOMINATIONS = {
  bills: [
    100000, // 100k
    50000,  // 50k
    20000,  // 20k
    10000,  // 10k
    5000,   // 5k
    2000,   // 2k
    1000    // 1k (technically discontinued but still in circulation)
  ],
  coins: [
    1000,   // 1k
    500,    // 500
    200,    // 200
    100,    // 100
    50      // 50
  ]
};
