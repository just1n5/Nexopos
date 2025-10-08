import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 120 })
  email: string;

  @Exclude()
  @Column({ select: false })
  password: string;

  @Column({ length: 60 })
  firstName: string;

  @Column({ length: 60 })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CASHIER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ default: false })
  isOwner: boolean; // true si es el admin que creó la cuenta

  @Column({ length: 20, nullable: true })
  documentId: string; // Cédula o documento de identidad

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
