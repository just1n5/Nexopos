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

export enum InvoiceType {
  POS = 'POS', // Documento POS Electrónico
  INVOICE = 'INVOICE', // Factura Electrónica
  CREDIT_NOTE = 'CREDIT_NOTE', // Nota Crédito
  DEBIT_NOTE = 'DEBIT_NOTE' // Nota Débito
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

@Entity('invoices_dian')
@Index(['invoiceNumber', 'prefix'], { unique: true })
@Index(['cufe'], { unique: true })
@Index(['saleId'])
@Index(['status'])
@Index(['createdAt'])
export class InvoiceDian {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // DIAN Resolution Data
  @Column()
  resolutionNumber: string; // Número de resolución DIAN

  @Column()
  resolutionDate: Date;

  @Column()
  prefix: string; // Prefijo autorizado (ej: SETP, POS, etc)

  @Column({ type: 'bigint' })
  invoiceNumber: number; // Número consecutivo

  @Column()
  rangeFrom: number; // Rango autorizado desde

  @Column()
  rangeTo: number; // Rango autorizado hasta

  // Invoice Type and Status
  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.POS
  })
  type: InvoiceType;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT
  })
  status: InvoiceStatus;

  // DIAN Specific Fields
  @Column({ unique: true, nullable: true })
  cufe: string; // Código Único de Factura Electrónica

  @Column({ nullable: true })
  cude: string; // Código Único de Documento Electrónico (for POS)

  @Column({ type: 'text', nullable: true })
  qrCode: string; // QR Code data

  @Column({ type: 'text', nullable: true })
  xmlContent: string; // XML completo del documento

  @Column({ type: 'text', nullable: true })
  signedXml: string; // XML firmado digitalmente

  @Column({ nullable: true })
  technicalKey: string; // Clave técnica

  // References
  @Column()
  saleId: string; // Reference to sale

  @ManyToOne('Sale')
  @JoinColumn({ name: 'saleId' })
  sale: any;

  // Company Information (denormalized for history)
  @Column()
  companyNit: string;

  @Column()
  companyName: string;

  @Column()
  companyAddress: string;

  @Column()
  companyPhone: string;

  @Column({ nullable: true })
  companyEmail: string;

  // Customer Information (denormalized for history)
  @Column({ nullable: true })
  customerNit: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerAddress: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  // Financial Summary
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  // Payment Information
  @Column()
  paymentMethod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  changeAmount: number;

  // DIAN Response
  @Column({ nullable: true })
  dianTransactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  dianResponseDate: Date;

  @Column({ type: 'text', nullable: true })
  dianResponseXml: string;

  @Column({ type: 'text', nullable: true })
  dianResponseMessage: string;

  // Error handling
  @Column({ nullable: true })
  errorCode: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // For storing additional DIAN-specific data

  @Column({ nullable: true })
  createdBy: string; // User who created the invoice

  @Column({ nullable: true })
  cancelledBy: string; // User who cancelled the invoice

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date; // When the invoice was cancelled

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;
}
