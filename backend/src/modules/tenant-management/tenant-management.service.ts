import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private dataSource: DataSource,
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

    // Enviar email OTP
    try {
      await this.emailService.sendOtpEmail({
        email: adminEmail,
        otpCode: otp.code,
        purpose: 'ACCOUNT_SUSPENSION',
        businessName: tenant.businessName,
      });

      return {
        message: 'Código OTP enviado al correo del administrador',
        expiresAt: otp.expiresAt,
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('No se pudo enviar el código OTP. Verifica la configuración de email.');
    }
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

    // Enviar email OTP
    try {
      await this.emailService.sendOtpEmail({
        email: adminEmail,
        otpCode: otp.code,
        purpose: 'ACCOUNT_DELETION',
        businessName: tenant.businessName,
      });

      return {
        message: 'Código OTP enviado al correo del administrador',
        expiresAt: otp.expiresAt,
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('No se pudo enviar el código OTP. Verifica la configuración de email.');
    }
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

    // Usar una transacción para eliminar todo en cascada
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Eliminar todas las entidades relacionadas en orden
      // IMPORTANTE: El orden importa para respetar las foreign keys

      // 1. Eliminar items de ventas
      await queryRunner.query(
        `DELETE FROM sale_item WHERE "saleId" IN (SELECT id FROM sale WHERE "tenantId" = $1)`,
        [tenantId],
      );

      // 2. Eliminar ventas
      await queryRunner.query(`DELETE FROM sale WHERE "tenantId" = $1`, [tenantId]);

      // 3. Eliminar movimientos de inventario
      await queryRunner.query(`DELETE FROM inventory_movement WHERE "tenantId" = $1`, [tenantId]);

      // 4. Eliminar productos
      await queryRunner.query(`DELETE FROM product WHERE "tenantId" = $1`, [tenantId]);

      // 5. Eliminar categorías
      await queryRunner.query(`DELETE FROM category WHERE "tenantId" = $1`, [tenantId]);

      // 6. Eliminar clientes
      await queryRunner.query(`DELETE FROM customer WHERE "tenantId" = $1`, [tenantId]);

      // 7. Eliminar créditos
      await queryRunner.query(`DELETE FROM credit WHERE "tenantId" = $1`, [tenantId]);

      // 8. Eliminar registros de caja
      await queryRunner.query(`DELETE FROM cash_register WHERE "tenantId" = $1`, [tenantId]);

      // 9. Eliminar usuarios
      await queryRunner.query(`DELETE FROM "user" WHERE "tenantId" = $1`, [tenantId]);

      // 10. Finalmente, eliminar el tenant
      await queryRunner.query(`DELETE FROM tenant WHERE id = $1`, [tenantId]);

      await queryRunner.commitTransaction();

      return {
        message: `Cuenta ${businessName} eliminada permanentemente`,
        deletedAt: new Date(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
