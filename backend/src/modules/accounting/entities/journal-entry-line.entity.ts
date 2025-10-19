import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { ChartOfAccounts } from './chart-of-accounts.entity';

/**
 * Tipo de movimiento en la línea del asiento
 */
export enum MovementType {
  DEBIT = 'DEBIT',     // Débito (cargo)
  CREDIT = 'CREDIT'    // Crédito (abono)
}

/**
 * Entidad que representa una línea individual de un asiento contable
 * Cada asiento contable tiene múltiples líneas (mínimo 2)
 * La suma de débitos debe ser igual a la suma de créditos
 */
@Entity('journal_entry_lines')
@Index(['journalEntryId'])
@Index(['accountId'])
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Relación con el asiento contable principal
   */
  @Column({ type: 'uuid' })
  journalEntryId: string;

  @ManyToOne(() => JournalEntry, entry => entry.lines, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry: JournalEntry;

  /**
   * Relación con la cuenta contable del PUC
   */
  @Column({ type: 'uuid' })
  accountId: string;

  @ManyToOne(() => ChartOfAccounts, {
    eager: true
  })
  @JoinColumn({ name: 'accountId' })
  account: ChartOfAccounts;

  /**
   * Tipo de movimiento: Débito o Crédito
   */
  @Column({
    type: 'enum',
    enum: MovementType
  })
  movementType: MovementType;

  /**
   * Monto de la línea
   * Siempre positivo, el tipo de movimiento (débito/crédito) indica la dirección
   */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  /**
   * Descripción específica de esta línea (opcional)
   * Por ejemplo: "Venta producto X", "Pago proveedor Y"
   */
  @Column({ length: 500, nullable: true })
  description?: string;

  /**
   * Orden de la línea dentro del asiento
   * Útil para mantener un orden lógico en la presentación
   */
  @Column({ type: 'integer', default: 0 })
  lineOrder: number;

  /**
   * Referencia adicional (opcional)
   * Puede ser útil para rastrear items específicos, productos, etc.
   */
  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  /**
   * Tipo de referencia adicional (opcional)
   * Ejemplo: 'SaleItem', 'Product', 'Customer'
   */
  @Column({ length: 50, nullable: true })
  referenceType?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Métodos de ayuda
   */

  // Verifica si es un débito
  isDebit(): boolean {
    return this.movementType === MovementType.DEBIT;
  }

  // Verifica si es un crédito
  isCredit(): boolean {
    return this.movementType === MovementType.CREDIT;
  }

  // Obtiene el monto con signo (positivo para débito, negativo para crédito)
  getSignedAmount(): number {
    return this.isDebit() ? Number(this.amount) : -Number(this.amount);
  }

  // Valida que el monto sea positivo
  isValidAmount(): boolean {
    return Number(this.amount) > 0;
  }
}
