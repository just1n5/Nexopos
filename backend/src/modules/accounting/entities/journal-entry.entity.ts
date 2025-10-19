import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { JournalEntryLine } from './journal-entry-line.entity';

/**
 * Estado del asiento contable
 */
export enum JournalEntryStatus {
  DRAFT = 'DRAFT',           // Borrador (editable)
  CONFIRMED = 'CONFIRMED',   // Confirmado (no editable)
  CANCELLED = 'CANCELLED'    // Anulado (requiere asiento de reversa)
}

/**
 * Tipo de asiento según su origen
 * Permite rastrear qué operación de negocio generó el asiento
 */
export enum JournalEntryType {
  // Ventas
  SALE = 'SALE',                           // Venta regular
  SALE_CREDIT = 'SALE_CREDIT',             // Venta a crédito (fiado)
  SALE_REFUND = 'SALE_REFUND',             // Devolución de venta

  // Compras y Gastos
  PURCHASE = 'PURCHASE',                   // Compra de inventario
  EXPENSE = 'EXPENSE',                     // Gasto operativo

  // Pagos y cobros
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',   // Pago recibido de cliente
  PAYMENT_MADE = 'PAYMENT_MADE',           // Pago realizado a proveedor

  // Caja
  CASH_REGISTER_OPEN = 'CASH_REGISTER_OPEN',     // Apertura de caja
  CASH_REGISTER_CLOSE = 'CASH_REGISTER_CLOSE',   // Cierre de caja
  CASH_DEPOSIT = 'CASH_DEPOSIT',                 // Depósito bancario
  CASH_WITHDRAWAL = 'CASH_WITHDRAWAL',           // Retiro de efectivo

  // Ajustes
  ADJUSTMENT = 'ADJUSTMENT',               // Ajuste manual
  OPENING_BALANCE = 'OPENING_BALANCE',     // Saldo inicial
  CLOSING = 'CLOSING',                     // Cierre contable de período

  // Otros
  OTHER = 'OTHER'                          // Otros asientos
}

/**
 * Entidad que representa un Asiento Contable (Journal Entry)
 * Un asiento agrupa múltiples líneas de débito y crédito
 * Cumple con el principio de Partida Doble: Débitos = Créditos
 */
@Entity('journal_entries')
@Index(['tenantId', 'entryDate'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'type'])
@Index(['referenceId', 'referenceType'])
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Número de asiento consecutivo
   * Formato: JE-2024-00001
   */
  @Column({ unique: true })
  entryNumber: string;

  /**
   * Fecha del asiento contable
   * Es la fecha de la transacción, no necesariamente la fecha de creación
   */
  @Column({ type: 'date' })
  entryDate: Date;

  /**
   * Tipo de asiento según su origen
   */
  @Column({
    type: 'enum',
    enum: JournalEntryType
  })
  type: JournalEntryType;

  /**
   * Estado del asiento
   */
  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.CONFIRMED
  })
  status: JournalEntryStatus;

  /**
   * Descripción del asiento
   * Explica la naturaleza de la transacción
   */
  @Column({ length: 500 })
  description: string;

  /**
   * Referencia al documento origen (Sale, Expense, Payment, etc.)
   * Es el ID de la transacción que generó este asiento
   */
  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  /**
   * Tipo de documento de referencia
   * Ejemplos: 'Sale', 'Expense', 'Payment', 'CashRegister'
   */
  @Column({ length: 50, nullable: true })
  referenceType?: string;

  /**
   * Número de documento de referencia (para trazabilidad)
   * Ejemplo: "POS-2024-00123", "EXP-2024-00045"
   */
  @Column({ length: 100, nullable: true })
  referenceNumber?: string;

  /**
   * Total de débitos
   * Calculado automáticamente desde las líneas
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDebits: number;

  /**
   * Total de créditos
   * Calculado automáticamente desde las líneas
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCredits: number;

  /**
   * Indicador de cuadratura
   * Un asiento válido siempre debe tener totalDebits = totalCredits
   */
  @Column({ type: 'boolean', default: true })
  isBalanced: boolean;

  /**
   * Notas adicionales (opcional)
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  /**
   * Usuario que creó el asiento
   */
  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  /**
   * Usuario que confirmó el asiento (si aplica)
   */
  @Column({ type: 'uuid', nullable: true })
  confirmedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'confirmedBy' })
  confirmer?: User;

  /**
   * Fecha de confirmación
   */
  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  /**
   * Usuario que canceló el asiento (si aplica)
   */
  @Column({ type: 'uuid', nullable: true })
  cancelledBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelledBy' })
  canceller?: User;

  /**
   * Fecha de cancelación
   */
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  /**
   * Razón de cancelación
   */
  @Column({ length: 500, nullable: true })
  cancellationReason?: string;

  /**
   * Asiento de reversa (si este asiento fue anulado)
   * Apunta al asiento que revierte este
   */
  @Column({ type: 'uuid', nullable: true })
  reversalEntryId?: string;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'reversalEntryId' })
  reversalEntry?: JournalEntry;

  // Multi-tenancy
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  /**
   * Relación con las líneas del asiento
   */
  @OneToMany(() => JournalEntryLine, line => line.journalEntry, {
    cascade: true,
    eager: true
  })
  lines: JournalEntryLine[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Métodos de ayuda
   */

  // Verifica si el asiento está cuadrado (débitos = créditos)
  validateBalance(): boolean {
    const debits = Number(this.totalDebits || 0);
    const credits = Number(this.totalCredits || 0);
    // Tolerancia de 1 centavo por errores de redondeo
    return Math.abs(debits - credits) < 0.01;
  }

  // Verifica si el asiento puede ser editado
  canEdit(): boolean {
    return this.status === JournalEntryStatus.DRAFT;
  }

  // Verifica si el asiento puede ser cancelado
  canCancel(): boolean {
    return this.status === JournalEntryStatus.CONFIRMED;
  }

  // Calcula la diferencia (para debugging)
  getDifference(): number {
    return Number(this.totalDebits || 0) - Number(this.totalCredits || 0);
  }
}
