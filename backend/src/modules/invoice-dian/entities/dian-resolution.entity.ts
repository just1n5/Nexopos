import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum ResolutionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED'
}

@Entity('dian_resolutions')
@Index(['prefix'], { unique: true })
@Index(['status'])
export class DianResolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Resolution Information
  @Column()
  resolutionNumber: string;

  @Column({ type: 'date' })
  resolutionDate: Date;

  @Column({ type: 'date' })
  validFrom: Date;

  @Column({ type: 'date' })
  validUntil: Date;

  // Numbering Configuration
  @Column({ unique: true })
  prefix: string; // SETP, POS, etc.

  @Column({ type: 'bigint' })
  rangeFrom: number;

  @Column({ type: 'bigint' })
  rangeTo: number;

  @Column({ type: 'bigint' })
  currentNumber: number; // Current consecutive number

  // Technical Configuration
  @Column()
  technicalKey: string;

  @Column({ nullable: true })
  testSetId: string; // For test environment

  // Status
  @Column({
    type: 'enum',
    enum: ResolutionStatus,
    default: ResolutionStatus.ACTIVE
  })
  status: ResolutionStatus;

  // Usage Statistics
  @Column({ type: 'bigint', default: 0 })
  invoicesIssued: number;

  @Column({ type: 'bigint', default: 0 })
  usedCount: number; // Count of invoices used

  @Column({ type: 'bigint' })
  invoicesRemaining: number;

  // Alert Thresholds
  @Column({ default: 100 })
  alertThreshold: number; // Alert when this many invoices remain

  @Column({ default: false })
  alertSent: boolean;

  // Metadata
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isExpired(): boolean {
    return new Date() > new Date(this.validUntil);
  }

  get percentageUsed(): number {
    const total = this.rangeTo - this.rangeFrom + 1;
    return (this.invoicesIssued / total) * 100;
  }
}
