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

      console.log(`[TenantManagement] Iniciando eliminación del tenant ${tenantId}`);

      // 1. Eliminar facturas DIAN
      await queryRunner.query(
        `DELETE FROM "invoices_dian" WHERE "saleId" IN (SELECT id FROM "sales" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1))`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Facturas DIAN eliminadas');

      // 2. Eliminar pagos de ventas
      await queryRunner.query(
        `DELETE FROM "payments" WHERE "saleId" IN (SELECT id FROM "sales" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1))`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Pagos eliminados');

      // 3. Eliminar items de ventas
      await queryRunner.query(
        `DELETE FROM "sale_items" WHERE "saleId" IN (SELECT id FROM "sales" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1))`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Items de ventas eliminados');

      // 4. Eliminar ventas
      await queryRunner.query(
        `DELETE FROM "sales" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1)`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Ventas eliminadas');
      
      // 5. Eliminar pagos de créditos de clientes
      await queryRunner.query(
        `DELETE FROM "customer_credit_payments" WHERE "creditId" IN (SELECT id FROM "customer_credits" WHERE "customerId" IN (SELECT id FROM "customers" WHERE "tenantId" = $1))`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Pagos de créditos eliminados');

      // 6. Eliminar créditos de clientes
      await queryRunner.query(
        `DELETE FROM "customer_credits" WHERE "customerId" IN (SELECT id FROM "customers" WHERE "tenantId" = $1)`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Créditos de clientes eliminados');

      // 7. Eliminar clientes
      await queryRunner.query(`DELETE FROM "customers" WHERE "tenantId" = $1`, [tenantId]);
      console.log('[TenantManagement] ✓ Clientes eliminados');

      // 8. Eliminar conteos de caja
      await queryRunner.query(
        `DELETE FROM "cash_counts" WHERE "registerId" IN (SELECT id FROM "cash_registers" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1))`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Conteos de caja eliminados');

      // 9. Eliminar movimientos de caja
      await queryRunner.query(
        `DELETE FROM "cash_movements" WHERE "registerId" IN (SELECT id FROM "cash_registers" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1))`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Movimientos de caja eliminados');

      // 10. Eliminar sesiones de caja (si existe la tabla)
      try {
        await queryRunner.query(
          `DELETE FROM "cash_register_sessions" WHERE "registerId" IN (SELECT id FROM "cash_registers" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1))`,
          [tenantId],
        );
        console.log('[TenantManagement] ✓ Sesiones de caja eliminadas');
      } catch (e) {
        console.log('[TenantManagement] ⚠ Tabla cash_register_sessions no existe o está vacía');
      }

      // 11. Eliminar registros de caja
      await queryRunner.query(
        `DELETE FROM "cash_registers" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1)`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Registros de caja eliminados');

      // 12. Eliminar stock de inventario
      await queryRunner.query(
        `DELETE FROM "inventory_stocks" WHERE "productId" IN (SELECT id FROM "products" WHERE "tenantId" = $1)`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Stock de inventario eliminado');

      // 13. Eliminar movimientos de inventario
      await queryRunner.query(
        `DELETE FROM "inventory_movements" WHERE "productId" IN (SELECT id FROM "products" WHERE "tenantId" = $1)`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Movimientos de inventario eliminados');

      // 14. Eliminar variantes de productos
      await queryRunner.query(
        `DELETE FROM "product_variants" WHERE "productId" IN (SELECT id FROM "products" WHERE "tenantId" = $1)`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Variantes de productos eliminadas');

      // 15. Eliminar productos
      await queryRunner.query(`DELETE FROM "products" WHERE "tenantId" = $1`, [tenantId]);
      console.log('[TenantManagement] ✓ Productos eliminados');

      // 16. Eliminar categorías
      await queryRunner.query(`DELETE FROM "categories" WHERE "tenantId" = $1`, [tenantId]);
      console.log('[TenantManagement] ✓ Categorías eliminadas');

      // 17. Eliminar resoluciones DIAN
      await queryRunner.query(`DELETE FROM "dian_resolutions" WHERE "tenantId" = $1`, [tenantId]);
      console.log('[TenantManagement] ✓ Resoluciones DIAN eliminadas');

      // 18. Eliminar auditorías de usuarios
      await queryRunner.query(
        `DELETE FROM "user_audits" WHERE "userId" IN (SELECT id FROM "users" WHERE "tenantId" = $1)`,
        [tenantId],
      );
      console.log('[TenantManagement] ✓ Auditorías de usuarios eliminadas');

      // 19. Eliminar OTPs relacionados con el tenant
      await queryRunner.query(`DELETE FROM "otp_codes" WHERE "relatedTenantId" = $1`, [tenantId]);
      console.log('[TenantManagement] ✓ OTPs eliminados');

      // 20. Eliminar usuarios
      await queryRunner.query(`DELETE FROM "users" WHERE "tenantId" = $1`, [tenantId]);
      console.log('[TenantManagement] ✓ Usuarios eliminados');

      // 21. Finalmente, eliminar el tenant
      await queryRunner.query(`DELETE FROM "tenants" WHERE id = $1`, [tenantId]);
      console.log('[TenantManagement] ✓ Tenant eliminado');

      await queryRunner.commitTransaction();
      console.log(`[TenantManagement] ✅ Eliminación completa del tenant ${businessName}`);

      return {
        message: `Cuenta ${businessName} eliminada permanentemente`,
        deletedAt: new Date(),
      };
    } catch (error) {
      console.error('[TenantManagement] ❌ Error durante eliminación:', error);
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
