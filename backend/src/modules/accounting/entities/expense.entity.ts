import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { JournalEntry } from './journal-entry.entity';

/**
 * Tipo/Categoría de gasto
 * Cada tipo se mapea internamente a una cuenta del PUC
 * El usuario selecciona íconos, el sistema traduce a cuentas contables
 */
export enum ExpenseType {
  // Compras
  INVENTORY_PURCHASE = 'INVENTORY_PURCHASE',      // 🛒 Compra de Inventario -> 1435

  // Gastos operativos
  RENT = 'RENT',                                  // 🏢 Arriendo -> 5120
  UTILITIES = 'UTILITIES',                        // 💡 Servicios Públicos -> 5135
  INTERNET_PHONE = 'INTERNET_PHONE',              // 🌐 Internet y Teléfono -> 5135
  PAYROLL = 'PAYROLL',                            // 🧑‍💼 Nómina/Sueldos -> 5105
  PROFESSIONAL_SERVICES = 'PROFESSIONAL_SERVICES', // ⚖️ Servicios Profesionales (abogado, contador) -> 5110
  INSURANCE = 'INSURANCE',                        // 🛡️ Seguros -> 5130
  MAINTENANCE = 'MAINTENANCE',                    // 🔧 Mantenimiento y Reparaciones -> 5145
  TRAVEL = 'TRAVEL',                              // ✈️ Viáticos/Viajes -> 5155
  ADVERTISING = 'ADVERTISING',                    // 📢 Publicidad -> 5195
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',            // 📎 Papelería y Útiles -> 5195
  TAXES_FEES = 'TAXES_FEES',                      // 🏛️ Impuestos y Tasas -> 5115

  // Otros
  OTHER = 'OTHER'                                 // ➕ Otro Gasto -> 5195
}

/**
 * Estado del gasto
 */
export enum ExpenseStatus {
  DRAFT = 'DRAFT',           // Borrador (en proceso de registro)
  PENDING = 'PENDING',       // Pendiente de pago
  PAID = 'PAID',             // Pagado
  CANCELLED = 'CANCELLED'    // Cancelado
}

/**
 * Método de pago del gasto
 */
export enum PaymentMethod {
  CASH = 'CASH',                 // 💵 Efectivo/Caja -> 1105
  BANK = 'BANK',                 // 🏦 Banco -> 1110
  CARD = 'CARD',                 // 💳 Tarjeta -> 1110
  TRANSFER = 'TRANSFER',         // 🔄 Transferencia -> 1110
  CREDIT = 'CREDIT'              // 📝 A crédito (por pagar) -> 2335
}

/**
 * Entidad que representa un Gasto o Compra del negocio
 * Incluye tanto compras de inventario como gastos operativos
 */
@Entity('expenses')
@Index(['tenantId', 'expenseDate'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'type'])
@Index(['expenseNumber'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Número consecutivo del gasto
   * Formato: EXP-2024-00001
   */
  @Column({ unique: true })
  expenseNumber: string;

  /**
   * Tipo/Categoría del gasto
   * El usuario lo selecciona vía íconos en la UI
   */
  @Column({
    type: 'enum',
    enum: ExpenseType
  })
  type: ExpenseType;

  /**
   * Estado del gasto
   */
  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING
  })
  status: ExpenseStatus;

  /**
   * Fecha del gasto (fecha de la factura del proveedor)
   */
  @Column({ type: 'date' })
  expenseDate: Date;

  /**
   * Proveedor (opcional, puede ser texto libre o relación futura)
   */
  @Column({ length: 200, nullable: true })
  supplierName?: string;

  /**
   * NIT del proveedor (opcional)
   */
  @Column({ length: 20, nullable: true })
  supplierNit?: string;

  /**
   * Número de factura del proveedor
   */
  @Column({ length: 100, nullable: true })
  invoiceNumber?: string;

  /**
   * Subtotal (base gravable)
   * Es el monto antes de IVA
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  /**
   * IVA descontable
   * Es el IVA que aparece en la factura del proveedor
   * Este valor se puede descontar del IVA generado en ventas
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  /**
   * Total del gasto (subtotal + IVA)
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  /**
   * Método de pago utilizado
   */
  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  /**
   * Fecha de pago (si ya fue pagado)
   */
  @Column({ type: 'date', nullable: true })
  paymentDate?: Date;

  /**
   * Descripción o notas del gasto
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * URL de la imagen de la factura
   * Guardada en storage (local o cloud)
   */
  @Column({ type: 'text', nullable: true })
  invoiceImageUrl?: string;

  /**
   * Datos extraídos por OCR (almacenados como JSON)
   * Incluye información raw del OCR para auditoría
   */
  @Column({ type: 'jsonb', nullable: true })
  ocrData?: {
    supplierName?: string;
    supplierNit?: string;
    invoiceNumber?: string;
    date?: string;
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    confidence?: number;
    rawText?: string;
  };

  /**
   * Indica si los datos fueron extraídos por OCR
   */
  @Column({ type: 'boolean', default: false })
  isOcrExtracted: boolean;

  /**
   * Indica si el usuario editó manualmente los datos del OCR
   */
  @Column({ type: 'boolean', default: false })
  wasManuallyEdited: boolean;

  /**
   * Relación con el asiento contable generado
   */
  @Column({ type: 'uuid', nullable: true })
  journalEntryId?: string;

  @ManyToOne(() => JournalEntry, { nullable: true })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry?: JournalEntry;

  /**
   * Usuario que registró el gasto
   */
  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  /**
   * Usuario que aprobó el pago (opcional)
   */
  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver?: User;

  /**
   * Fecha de aprobación
   */
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  // Multi-tenancy
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Métodos de ayuda
   */

  // Verifica si el gasto está pagado
  isPaid(): boolean {
    return this.status === ExpenseStatus.PAID;
  }

  // Verifica si el gasto es a crédito
  isCredit(): boolean {
    return this.paymentMethod === PaymentMethod.CREDIT;
  }

  // Verifica si tiene IVA descontable
  hasDeductibleTax(): boolean {
    return Number(this.taxAmount || 0) > 0;
  }

  // Obtiene el ícono emoji según el tipo
  getIcon(): string {
    const iconMap: Record<ExpenseType, string> = {
      [ExpenseType.INVENTORY_PURCHASE]: '🛒',
      [ExpenseType.RENT]: '🏢',
      [ExpenseType.UTILITIES]: '💡',
      [ExpenseType.INTERNET_PHONE]: '🌐',
      [ExpenseType.PAYROLL]: '🧑‍💼',
      [ExpenseType.PROFESSIONAL_SERVICES]: '⚖️',
      [ExpenseType.INSURANCE]: '🛡️',
      [ExpenseType.MAINTENANCE]: '🔧',
      [ExpenseType.TRAVEL]: '✈️',
      [ExpenseType.ADVERTISING]: '📢',
      [ExpenseType.OFFICE_SUPPLIES]: '📎',
      [ExpenseType.TAXES_FEES]: '🏛️',
      [ExpenseType.OTHER]: '➕'
    };
    return iconMap[this.type] || '➕';
  }

  // Obtiene el código PUC de la cuenta de gasto
  getPUCCode(): string {
    const pucMap: Record<ExpenseType, string> = {
      [ExpenseType.INVENTORY_PURCHASE]: '1435',
      [ExpenseType.RENT]: '5120',
      [ExpenseType.UTILITIES]: '5135',
      [ExpenseType.INTERNET_PHONE]: '5135',
      [ExpenseType.PAYROLL]: '5105',
      [ExpenseType.PROFESSIONAL_SERVICES]: '5110',
      [ExpenseType.INSURANCE]: '5130',
      [ExpenseType.MAINTENANCE]: '5145',
      [ExpenseType.TRAVEL]: '5155',
      [ExpenseType.ADVERTISING]: '5195',
      [ExpenseType.OFFICE_SUPPLIES]: '5195',
      [ExpenseType.TAXES_FEES]: '5115',
      [ExpenseType.OTHER]: '5195'
    };
    return pucMap[this.type] || '5195';
  }

  // Obtiene el código PUC de la cuenta de pago
  getPaymentAccountPUC(): string {
    const paymentMap: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: '1105',      // Caja
      [PaymentMethod.BANK]: '1110',      // Bancos
      [PaymentMethod.CARD]: '1110',      // Bancos
      [PaymentMethod.TRANSFER]: '1110',  // Bancos
      [PaymentMethod.CREDIT]: '2335'     // Costos y Gastos por Pagar
    };
    return paymentMap[this.paymentMethod] || '1105';
  }
}
