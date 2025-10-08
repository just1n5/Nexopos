import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('beta_keys')
export class BetaKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  key: string; // Formato: BETA-XXXXX-XXXXX

  @Column({ default: false })
  isUsed: boolean;

  @Column({ type: 'uuid', nullable: true })
  usedByTenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'usedByTenantId' })
  usedByTenant: Tenant | null;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null; // Para notas del admin sobre a quién se asignó

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
