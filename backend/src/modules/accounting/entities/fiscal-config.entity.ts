import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * Régimen tributario en Colombia
 */
export enum TaxRegime {
  SIMPLIFIED = 'SIMPLIFIED',             // Régimen Simplificado
  COMMON = 'COMMON',                     // Régimen Común
  SPECIAL = 'SPECIAL',                   // Régimen Especial
  GRANDES_CONTRIBUYENTES = 'GRANDES_CONTRIBUYENTES'  // Grandes Contribuyentes
}

/**
 * Período de declaración de IVA
 */
export enum VATDeclarationPeriod {
  MONTHLY = 'MONTHLY',           // Mensual (no común para PYMES)
  BIMONTHLY = 'BIMONTHLY',       // Bimestral (más común)
  QUARTERLY = 'QUARTERLY'        // Trimestral
}

/**
 * Tipo de persona
 */
export enum PersonType {
  NATURAL = 'NATURAL',           // Persona Natural
  JURIDICA = 'JURIDICA'          // Persona Jurídica
}

/**
 * Responsabilidades fiscales según la DIAN
 * Múltiples responsabilidades pueden estar activas
 */
export enum FiscalResponsibility {
  R_01_IVA = 'R-01-IVA',                                       // Responsable de IVA
  R_02_RETEFUENTE = 'R-02-RETEFUENTE',                         // Agente retenedor Renta
  R_03_RETEIVA = 'R-03-RETEIVA',                               // Agente retenedor IVA
  R_04_RETEICA = 'R-04-RETEICA',                               // Agente retenedor ICA
  R_07_REGIMEN_SIMPLE = 'R-07-REGIMEN-SIMPLE',                 // Régimen Simple de Tributación
  R_99_NO_RESPONSABLE = 'R-99-NO-RESPONSABLE'                  // No responsable de IVA
}

/**
 * Entidad que almacena la configuración fiscal de un tenant/negocio
 * Esta información es crucial para el cálculo correcto de impuestos y obligaciones
 * Relación 1:1 con Tenant
 */
@Entity('fiscal_configs')
@Index(['tenantId'], { unique: true })
export class FiscalConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Régimen tributario del negocio
   */
  @Column({
    type: 'enum',
    enum: TaxRegime,
    default: TaxRegime.COMMON
  })
  taxRegime: TaxRegime;

  /**
   * Tipo de persona
   */
  @Column({
    type: 'enum',
    enum: PersonType,
    default: PersonType.NATURAL
  })
  personType: PersonType;

  /**
   * NIT de la empresa
   */
  @Column({ length: 20 })
  nit: string;

  /**
   * Dígito de verificación del NIT
   */
  @Column({ length: 1, nullable: true })
  nitVerificationDigit?: string;

  /**
   * Razón social o nombre completo
   */
  @Column({ length: 200 })
  legalName: string;

  /**
   * Nombre comercial (si es diferente)
   */
  @Column({ length: 200, nullable: true })
  tradeName?: string;

  /**
   * Dirección fiscal
   */
  @Column({ length: 300 })
  fiscalAddress: string;

  /**
   * Ciudad/Municipio
   */
  @Column({ length: 100 })
  city: string;

  /**
   * Departamento/Estado
   */
  @Column({ length: 100 })
  state: string;

  /**
   * Código postal
   */
  @Column({ length: 20, nullable: true })
  postalCode?: string;

  /**
   * Teléfono de contacto
   */
  @Column({ length: 50, nullable: true })
  phone?: string;

  /**
   * Email fiscal (para notificaciones DIAN)
   */
  @Column({ length: 200, nullable: true })
  fiscalEmail?: string;

  /**
   * Responsabilidades fiscales
   * Almacenado como array de strings
   */
  @Column({ type: 'simple-array' })
  fiscalResponsibilities: FiscalResponsibility[];

  /**
   * Indica si es agente retenedor de Renta
   * Si true, debe practicar retenciones en la fuente
   */
  @Column({ type: 'boolean', default: false })
  isRetentionAgent: boolean;

  /**
   * Fecha desde la cual es agente retenedor
   */
  @Column({ type: 'date', nullable: true })
  retentionAgentSince?: Date;

  /**
   * Indica si es responsable de IVA
   */
  @Column({ type: 'boolean', default: true })
  isVATResponsible: boolean;

  /**
   * Período de declaración de IVA
   */
  @Column({
    type: 'enum',
    enum: VATDeclarationPeriod,
    default: VATDeclarationPeriod.BIMONTHLY
  })
  vatDeclarationPeriod: VATDeclarationPeriod;

  /**
   * CIIU - Clasificación Industrial Internacional Uniforme
   * Código de 4 dígitos que identifica la actividad económica principal
   */
  @Column({ length: 10, nullable: true })
  ciiu?: string;

  /**
   * Descripción de la actividad económica
   */
  @Column({ length: 300, nullable: true })
  economicActivity?: string;

  /**
   * Indica si está inscrito en el RUT (Registro Único Tributario)
   */
  @Column({ type: 'boolean', default: false })
  hasRUT: boolean;

  /**
   * URL del documento RUT (PDF)
   */
  @Column({ type: 'text', nullable: true })
  rutDocumentUrl?: string;

  /**
   * Indica si usa facturación electrónica
   */
  @Column({ type: 'boolean', default: false })
  useElectronicInvoicing: boolean;

  /**
   * Proveedor Tecnológico Autorizado (PTA) para facturación electrónica
   * Ejemplos: 'SIIGO', 'ALEGRA', 'DATAICO', etc.
   */
  @Column({ length: 100, nullable: true })
  electronicInvoiceProvider?: string;

  /**
   * Resolución de facturación DIAN
   * Número de resolución que autoriza la numeración de facturas
   */
  @Column({ length: 100, nullable: true })
  dianResolutionNumber?: string;

  /**
   * Fecha de resolución DIAN
   */
  @Column({ type: 'date', nullable: true })
  dianResolutionDate?: Date;

  /**
   * Rango autorizado de numeración - Desde
   */
  @Column({ type: 'bigint', nullable: true })
  invoiceRangeFrom?: number;

  /**
   * Rango autorizado de numeración - Hasta
   */
  @Column({ type: 'bigint', nullable: true })
  invoiceRangeTo?: number;

  /**
   * Prefijo de facturación
   * Ejemplo: 'FV', 'FVPOS', etc.
   */
  @Column({ length: 10, nullable: true })
  invoicePrefix?: string;

  /**
   * Próximo número de factura a generar
   */
  @Column({ type: 'bigint', default: 1 })
  nextInvoiceNumber: number;

  /**
   * Representante legal (para personas jurídicas)
   */
  @Column({ length: 200, nullable: true })
  legalRepresentative?: string;

  /**
   * Cédula del representante legal
   */
  @Column({ length: 20, nullable: true })
  legalRepresentativeId?: string;

  /**
   * Contador público (información de contacto)
   */
  @Column({ length: 200, nullable: true })
  accountantName?: string;

  /**
   * Tarjeta profesional del contador
   */
  @Column({ length: 50, nullable: true })
  accountantProfessionalCard?: string;

  /**
   * Año fiscal de inicio de operaciones contables en el sistema
   * Útil para saber desde cuándo hay información contable
   */
  @Column({ type: 'integer', nullable: true })
  fiscalYearStart?: number;

  /**
   * Configuraciones adicionales (JSON flexible)
   * Para futuras configuraciones sin modificar esquema
   */
  @Column({ type: 'jsonb', nullable: true })
  additionalConfig?: {
    autoGenerateJournalEntries?: boolean;
    requiresInvoiceApproval?: boolean;
    defaultTaxRate?: number;
    [key: string]: any;
  };

  /**
   * Indica si la configuración está completa y validada
   */
  @Column({ type: 'boolean', default: false })
  isConfigured: boolean;

  /**
   * Indica si la configuración fue verificada por un contador
   */
  @Column({ type: 'boolean', default: false })
  isVerifiedByAccountant: boolean;

  /**
   * Fecha de verificación
   */
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  // Relación 1:1 con Tenant
  @Column({ type: 'uuid', unique: true })
  tenantId: string;

  @OneToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Métodos de ayuda
   */

  // Verifica si puede practicar retenciones
  canPracticeWithholdings(): boolean {
    return this.isRetentionAgent;
  }

  // Verifica si es persona jurídica
  isLegalEntity(): boolean {
    return this.personType === PersonType.JURIDICA;
  }

  // Verifica si es persona natural
  isNaturalPerson(): boolean {
    return this.personType === PersonType.NATURAL;
  }

  // Obtiene el NIT completo con DV
  getFullNIT(): string {
    return this.nitVerificationDigit
      ? `${this.nit}-${this.nitVerificationDigit}`
      : this.nit;
  }

  // Verifica si tiene una responsabilidad específica
  hasResponsibility(responsibility: FiscalResponsibility): boolean {
    return this.fiscalResponsibilities.includes(responsibility);
  }

  // Verifica si la configuración está lista para operar
  isReadyToOperate(): boolean {
    return this.isConfigured &&
           !!this.nit &&
           !!this.legalName &&
           !!this.fiscalAddress &&
           this.fiscalResponsibilities.length > 0;
  }

  // Obtiene el siguiente número de factura y lo incrementa
  getAndIncrementInvoiceNumber(): number {
    const current = this.nextInvoiceNumber;
    this.nextInvoiceNumber = current + 1;
    return current;
  }

  // Valida que el número de factura esté dentro del rango autorizado
  isInvoiceNumberValid(invoiceNumber: number): boolean {
    if (!this.invoiceRangeFrom || !this.invoiceRangeTo) {
      return true; // Sin restricción si no hay rangos definidos
    }
    return invoiceNumber >= this.invoiceRangeFrom &&
           invoiceNumber <= this.invoiceRangeTo;
  }
}
