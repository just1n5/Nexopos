import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum TaxType {
  IVA = 'IVA',
  INC = 'INC',
  RETENCION = 'RETENCION',
  OTHER = 'OTHER'
}

@Entity('taxes')
export class Tax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TaxType, default: TaxType.IVA })
  type: TaxType;

  @Column('decimal', { precision: 5, scale: 2 })
  rate: number; // Percentage (e.g., 19.00 for 19%)

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ length: 50, nullable: true })
  code?: string; // Code for DIAN or accounting purposes

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}