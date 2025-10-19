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
import { Sale } from '../../sales/entities/sale.entity';
import { Expense } from './expense.entity';

/**
 * Tipo de retención fiscal
 */
export enum WithholdingType {
  RETEFTE = 'RETEFTE',     // Retención en la Fuente (Impuesto de Renta)
  RETEIVA = 'RETEIVA',     // Retención de IVA
  RETEICA = 'RETEICA'      // Retención de Industria y Comercio
}

/**
 * Concepto de retención en la fuente
 * Cada concepto tiene una tarifa específica según normativa DIAN
 */
export enum WithholdingConcept {
  // Conceptos cuando LE RETIENEN (a favor del negocio)
  COMPRAS = 'COMPRAS',                       // 2.5% - Compras en general
  SERVICIOS_DECLARANTE = 'SERVICIOS_DECLARANTE',     // 4% - Servicios, proveedor declarante
  SERVICIOS_NO_DECLARANTE = 'SERVICIOS_NO_DECLARANTE', // 6% - Servicios, proveedor no declarante
  HONORARIOS_JURIDICA = 'HONORARIOS_JURIDICA',       // 11% - Honorarios a persona jurídica
  HONORARIOS_NATURAL = 'HONORARIOS_NATURAL',         // 10% - Honorarios a persona natural

  // Conceptos cuando EL NEGOCIO RETIENE (obligación)
  ARRENDAMIENTO = 'ARRENDAMIENTO',           // 3.5% - Arrendamiento de bienes inmuebles
  RENDIMIENTOS_FINANCIEROS = 'RENDIMIENTOS_FINANCIEROS', // 7% - Rendimientos financieros
  OTROS = 'OTROS'                            // Otros conceptos
}

/**
 * Dirección de la retención
 */
export enum WithholdingDirection {
  RECEIVED = 'RECEIVED',     // Retención recibida (A FAVOR - aumenta activo)
  PRACTICED = 'PRACTICED'    // Retención practicada (OBLIGACIÓN - aumenta pasivo)
}

/**
 * Entidad que representa una Retención Fiscal
 * Aplica tanto para retenciones a favor como retenciones que el negocio debe practicar
 */
@Entity('tax_withholdings')
@Index(['tenantId', 'withholdingDate'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'direction'])
@Index(['certificateNumber'])
export class TaxWithholding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Número consecutivo de retención
   * Formato: RET-2024-00001
   */
  @Column({ length: 50 })
  withholdingNumber: string;

  /**
   * Tipo de retención
   */
  @Column({
    type: 'enum',
    enum: WithholdingType
  })
  type: WithholdingType;

  /**
   * Concepto de retención
   */
  @Column({
    type: 'enum',
    enum: WithholdingConcept
  })
  concept: WithholdingConcept;

  /**
   * Dirección: recibida (a favor) o practicada (obligación)
   */
  @Column({
    type: 'enum',
    enum: WithholdingDirection
  })
  direction: WithholdingDirection;

  /**
   * Fecha de la retención
   */
  @Column({ type: 'date' })
  withholdingDate: Date;

  /**
   * Base sobre la cual se calcula la retención
   * Generalmente es el subtotal de la venta o compra
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  baseAmount: number;

  /**
   * Porcentaje de retención aplicado
   * Ejemplo: 2.5, 4, 6, 10, 11
   */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  /**
   * Valor retenido (calculado: baseAmount * percentage / 100)
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  withheldAmount: number;

  /**
   * Tercero involucrado (cliente o proveedor)
   * Si direction = RECEIVED: es el cliente que retuvo
   * Si direction = PRACTICED: es el proveedor al que se le retuvo
   */
  @Column({ length: 200 })
  thirdPartyName: string;

  /**
   * NIT del tercero
   */
  @Column({ length: 20 })
  thirdPartyNit: string;

  /**
   * Número de certificado de retención
   * Es el documento oficial que respalda la retención
   */
  @Column({ length: 100, unique: true, nullable: true })
  certificateNumber?: string;

  /**
   * URL del certificado PDF (si fue generado)
   */
  @Column({ type: 'text', nullable: true })
  certificateUrl?: string;

  /**
   * Relación con la venta (si la retención está asociada a una venta)
   */
  @Column({ type: 'uuid', nullable: true })
  saleId?: string;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'saleId' })
  sale?: Sale;

  /**
   * Relación con el gasto (si la retención está asociada a un gasto/compra)
   */
  @Column({ type: 'uuid', nullable: true })
  expenseId?: string;

  @ManyToOne(() => Expense, { nullable: true })
  @JoinColumn({ name: 'expenseId' })
  expense?: Expense;

  /**
   * Notas adicionales
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  /**
   * Usuario que registró la retención
   */
  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  /**
   * Año fiscal al que pertenece la retención
   * Útil para reportes anuales
   */
  @Column({ type: 'integer' })
  fiscalYear: number;

  /**
   * Indica si la retención ya fue declarada a la DIAN
   */
  @Column({ type: 'boolean', default: false })
  isDeclared: boolean;

  /**
   * Fecha de declaración a la DIAN
   */
  @Column({ type: 'date', nullable: true })
  declaredAt?: Date;

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

  // Verifica si es una retención a favor
  isInFavor(): boolean {
    return this.direction === WithholdingDirection.RECEIVED;
  }

  // Verifica si es una retención practicada
  isPracticed(): boolean {
    return this.direction === WithholdingDirection.PRACTICED;
  }

  // Obtiene el código PUC según la dirección
  getPUCCode(): string {
    // Si es a favor: 135515 - Retención en la Fuente (Activo)
    // Si es practicada: 2365 - Retención en la Fuente (Pasivo)
    return this.isInFavor() ? '135515' : '2365';
  }

  // Calcula el valor retenido (para validación)
  calculateWithheldAmount(): number {
    return (Number(this.baseAmount) * Number(this.percentage)) / 100;
  }

  // Valida que el cálculo sea correcto
  isValidCalculation(): boolean {
    const calculated = this.calculateWithheldAmount();
    const difference = Math.abs(calculated - Number(this.withheldAmount));
    // Tolerancia de 1 centavo
    return difference < 0.01;
  }

  // Obtiene el nombre descriptivo del concepto
  getConceptName(): string {
    const conceptNames: Record<WithholdingConcept, string> = {
      [WithholdingConcept.COMPRAS]: 'Compras (2.5%)',
      [WithholdingConcept.SERVICIOS_DECLARANTE]: 'Servicios - Declarante (4%)',
      [WithholdingConcept.SERVICIOS_NO_DECLARANTE]: 'Servicios - No Declarante (6%)',
      [WithholdingConcept.HONORARIOS_JURIDICA]: 'Honorarios - Persona Jurídica (11%)',
      [WithholdingConcept.HONORARIOS_NATURAL]: 'Honorarios - Persona Natural (10%)',
      [WithholdingConcept.ARRENDAMIENTO]: 'Arrendamiento (3.5%)',
      [WithholdingConcept.RENDIMIENTOS_FINANCIEROS]: 'Rendimientos Financieros (7%)',
      [WithholdingConcept.OTROS]: 'Otros'
    };
    return conceptNames[this.concept] || 'Otro';
  }
}
