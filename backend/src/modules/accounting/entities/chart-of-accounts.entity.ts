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

/**
 * Naturaleza de la cuenta contable
 * - DEBIT: Cuentas que aumentan con débitos (Activos, Gastos, Costos)
 * - CREDIT: Cuentas que aumentan con créditos (Pasivos, Patrimonio, Ingresos)
 */
export enum AccountNature {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

/**
 * Tipo de cuenta según ecuación contable
 */
export enum AccountType {
  ASSET = 'ASSET',           // Activo (1xxx)
  LIABILITY = 'LIABILITY',   // Pasivo (2xxx)
  EQUITY = 'EQUITY',         // Patrimonio (3xxx)
  INCOME = 'INCOME',         // Ingresos (4xxx)
  EXPENSE = 'EXPENSE',       // Gastos (5xxx)
  COST = 'COST'              // Costos (6xxx)
}

/**
 * Entidad que representa el Plan Único de Cuentas (PUC) simplificado
 * Este es el "Mini-PUC" interno de 30-40 cuentas esenciales
 * basado en el Decreto 2650 de 1993 (Colombia)
 */
@Entity('chart_of_accounts')
@Index(['tenantId', 'code'], { unique: true }) // Código único por tenant
@Index(['tenantId', 'isActive'])
export class ChartOfAccounts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Código PUC oficial (ej: 1105, 4135, 2408)
   * Este código es estándar según normativa colombiana
   */
  @Column({ length: 10 })
  code: string;

  /**
   * Nombre de la cuenta
   * Ejemplo: "Caja", "Bancos", "IVA por Pagar", "Comercio al por mayor"
   */
  @Column({ length: 200 })
  name: string;

  /**
   * Descripción detallada de la cuenta (opcional)
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Naturaleza de la cuenta (Débito o Crédito)
   */
  @Column({
    type: 'enum',
    enum: AccountNature
  })
  nature: AccountNature;

  /**
   * Tipo de cuenta según clasificación contable
   */
  @Column({
    type: 'enum',
    enum: AccountType
  })
  type: AccountType;

  /**
   * Indica si la cuenta está activa y puede ser usada
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Cuenta padre (para estructura jerárquica - opcional en MVP)
   * Permite tener subcuentas en el futuro
   */
  @Column({ type: 'uuid', nullable: true })
  parentAccountId?: string;

  @ManyToOne(() => ChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'parentAccountId' })
  parentAccount?: ChartOfAccounts;

  /**
   * Nivel de la cuenta (1-6)
   * 1: Clase (1, 2, 3, 4, 5, 6)
   * 2: Grupo (11, 13, 14, 41, 51)
   * 3: Cuenta (110, 130, 135, 410, 510)
   * 4: Subcuenta (1105, 1305, 4135, 5135)
   */
  @Column({ type: 'integer', default: 4 })
  level: number;

  // Multi-tenancy: cada plan de cuentas pertenece a un tenant
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

  // Verifica si es una cuenta de activo
  isAsset(): boolean {
    return this.type === AccountType.ASSET;
  }

  // Verifica si es una cuenta de pasivo
  isLiability(): boolean {
    return this.type === AccountType.LIABILITY;
  }

  // Verifica si es una cuenta de resultado (ingresos, gastos, costos)
  isResultAccount(): boolean {
    return [AccountType.INCOME, AccountType.EXPENSE, AccountType.COST].includes(this.type);
  }

  // Obtiene el primer dígito del código (clase)
  getClass(): number {
    return parseInt(this.code.charAt(0));
  }
}
