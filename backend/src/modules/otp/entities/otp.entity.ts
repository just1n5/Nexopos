import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OtpPurpose {
  ACCOUNT_DELETION = 'ACCOUNT_DELETION',
  ACCOUNT_SUSPENSION = 'ACCOUNT_SUSPENSION',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 6 })
  code: string;

  @Column({ length: 120 })
  email: string;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose: OtpPurpose;

  @Column({ type: 'uuid', nullable: true })
  relatedTenantId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
