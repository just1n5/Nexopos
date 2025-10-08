import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import { OtpPurpose } from '../otp/entities/otp.entity';

@Injectable()
export class TenantManagementService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  /**
   * Obtener todos los tenants (para SUPER_ADMIN)
   */
  async getAllTenants() {
    const tenants = await this.tenantRepository.find({
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      businessName: tenant.businessName,
      nit: tenant.nit,
      businessType: tenant.businessType,
      email: tenant.email,
      phone: tenant.phone,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      usersCount: tenant.users?.length || 0,
      ownerEmail: tenant.users?.find((u) => u.isOwner)?.email || null,
    }));
  }

  /**
   * Solicitar OTP para suspender cuenta
   */
  async requestSuspensionOtp(tenantId: string, adminEmail: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    if (!tenant.isActive) {
      throw new BadRequestException('Esta cuenta ya está suspendida');
    }

    // Crear OTP
    const otp = await this.otpService.createOtp(
      adminEmail,
      OtpPurpose.ACCOUNT_SUSPENSION,
      tenantId,
    );

    // Enviar email
    await this.emailService.sendOtpEmail({
      email: adminEmail,
      otpCode: otp.code,
      purpose: 'ACCOUNT_SUSPENSION',
      businessName: tenant.businessName,
    });

    return {
      message: 'OTP enviado al correo del administrador',
      expiresAt: otp.expiresAt,
    };
  }

  /**
   * Solicitar OTP para eliminar cuenta
   */
  async requestDeletionOtp(tenantId: string, adminEmail: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Crear OTP
    const otp = await this.otpService.createOtp(
      adminEmail,
      OtpPurpose.ACCOUNT_DELETION,
      tenantId,
    );

    // Enviar email
    await this.emailService.sendOtpEmail({
      email: adminEmail,
      otpCode: otp.code,
      purpose: 'ACCOUNT_DELETION',
      businessName: tenant.businessName,
    });

    return {
      message: 'OTP enviado al correo del administrador',
      expiresAt: otp.expiresAt,
    };
  }

  /**
   * Suspender cuenta (requiere OTP verificado)
   */
  async suspendAccount(tenantId: string, otpCode: string, adminEmail: string) {
    // Verificar OTP
    await this.otpService.verifyOtp(
      adminEmail,
      otpCode,
      OtpPurpose.ACCOUNT_SUSPENSION,
      tenantId,
    );

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Suspender cuenta
    tenant.isActive = false;
    await this.tenantRepository.save(tenant);

    // Desactivar todos los usuarios del tenant
    await this.userRepository.update(
      { tenantId },
      { isActive: false },
    );

    return {
      message: `Cuenta ${tenant.businessName} suspendida exitosamente`,
      tenantId: tenant.id,
      businessName: tenant.businessName,
    };
  }

  /**
   * Eliminar cuenta (requiere OTP verificado)
   */
  async deleteAccount(tenantId: string, otpCode: string, adminEmail: string) {
    // Verificar OTP
    await this.otpService.verifyOtp(
      adminEmail,
      otpCode,
      OtpPurpose.ACCOUNT_DELETION,
      tenantId,
    );

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const businessName = tenant.businessName;

    // Eliminar usuarios del tenant
    await this.userRepository.delete({ tenantId });

    // Eliminar tenant
    await this.tenantRepository.remove(tenant);

    return {
      message: `Cuenta ${businessName} eliminada permanentemente`,
      deletedAt: new Date(),
    };
  }

  /**
   * Reactivar cuenta suspendida
   */
  async reactivateAccount(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    if (tenant.isActive) {
      throw new BadRequestException('Esta cuenta ya está activa');
    }

    // Reactivar cuenta
    tenant.isActive = true;
    await this.tenantRepository.save(tenant);

    // Reactivar usuarios del tenant
    await this.userRepository.update(
      { tenantId },
      { isActive: true },
    );

    return {
      message: `Cuenta ${tenant.businessName} reactivada exitosamente`,
      tenantId: tenant.id,
      businessName: tenant.businessName,
    };
  }
}
