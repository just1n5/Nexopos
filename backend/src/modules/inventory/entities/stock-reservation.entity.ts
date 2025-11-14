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
import { InventoryStock } from './inventory-stock.entity';

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED'
}

@Entity('stock_reservations')
@Index(['stockId'])
@Index(['referenceId', 'referenceType'])
@Index(['status'])
@Index(['expiresAt'])
export class StockReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  stockId: string;

  @ManyToOne(() => InventoryStock)
  @JoinColumn({ name: 'stockId' })
  stock: InventoryStock;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productVariantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE
  })
  status: ReservationStatus;

  // Referencia a la entidad que creó la reserva (sale, quote, etc.)
  @Column({ nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column()
  userId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Tiempo de expiración (por defecto 15 minutos)
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helpers
  get isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }

  get isActive(): boolean {
    return this.status === ReservationStatus.ACTIVE && !this.isExpired;
  }
}
