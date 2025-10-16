import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { User, UserRole } from '../users/entities/user.entity';
import { BetaKeysService } from '../beta-keys/beta-keys.service';
import { TenantsService } from '../tenants/tenants.service';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/entities/otp.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly betaKeysService: BetaKeysService,
    private readonly tenantsService: TenantsService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registro completo de nueva organización + usuario admin
   * Se ejecuta en transacción para garantizar consistencia
   */
  async register(registerDto: RegisterDto): Promise<{ user: User; tenant: any; accessToken: string }> {
    // Validar beta key
    const betaKeyValidation = await this.betaKeysService.validateBetaKey(registerDto.betaKey);
    if (!betaKeyValidation.valid) {
      throw new BadRequestException(betaKeyValidation.message);
    }

    // Verificar que el email no exista
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Transacción para crear tenant + user + marcar beta key
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear Tenant
      const tenant = await this.tenantsService.create({
        businessName: registerDto.businessName,
        nit: registerDto.nit,
        businessType: registerDto.businessType,
        address: registerDto.address,
        phone: registerDto.businessPhone,
        email: registerDto.businessEmail,
        betaKeyUsed: registerDto.betaKey,
      });

      // 2. Crear Usuario Admin (owner)
      const user = await this.usersService.create({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.ADMIN,
        isOwner: true,
        documentId: registerDto.documentId,
        phoneNumber: registerDto.phoneNumber,
      }, tenant.id);

      // 3. Marcar beta key como usada
      await this.betaKeysService.markAsUsed(registerDto.betaKey, tenant.id);

      await queryRunner.commitTransaction();

      // Generar token JWT
      const safeUser = await this.usersService.findById(user.id, tenant.id);
      const accessToken = this.generateAccessToken(safeUser);

      // Enviar email de bienvenida (async, no bloquea el registro)
      this.emailService.sendWelcomeEmail({
        businessName: tenant.businessName,
        adminName: `${user.firstName} ${user.lastName}`,
        adminEmail: user.email,
        betaKey: registerDto.betaKey,
      }).catch(err => {
        // Log error pero no fallar el registro
        console.error('Failed to send welcome email:', err);
      });

      return { user: safeUser, tenant, accessToken };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto): Promise<{ user: User; tenant: any; accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const safeUser = await this.usersService.findById(user.id, user.tenantId);
    const accessToken = this.generateAccessToken(safeUser);

    // Obtener información del tenant
    let tenant = null;
    if (safeUser.tenantId) {
      tenant = await this.tenantsService.findOne(safeUser.tenantId);
      if (tenant && !tenant.isActive) {
        throw new UnauthorizedException('The business account has been suspended.');
      }
    }

    return { user: safeUser, tenant, accessToken };
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or user inactive.');
    }

    const isValid = await this.usersService.validatePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return user;
  }

  async requestEmailVerificationOtp(email: string) {
    // Verificar que el email no esté ya registrado
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Crear OTP
    const otp = await this.otpService.createOtp(
      email,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    // Enviar email con OTP
    try {
      await this.emailService.sendOtpEmail({
        email,
        otpCode: otp.code,
        purpose: 'EMAIL_VERIFICATION',
      });

      return {
        message: 'Código de verificación enviado al correo',
        expiresAt: otp.expiresAt,
      };
    } catch (error) {
      console.error('Failed to send verification OTP email:', error);
      throw new Error('No se pudo enviar el código de verificación. Verifica la configuración de email.');
    }
  }

  async verifyEmailOtp(email: string, otpCode: string) {
    try {
      await this.otpService.verifyOtp(
        email,
        otpCode,
        OtpPurpose.EMAIL_VERIFICATION,
      );

      return {
        verified: true,
        message: 'Email verificado correctamente',
        email,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Código OTP inválido o expirado');
    }
  }

  async checkUserExists(identifier: string): Promise<{ exists: boolean; name?: string; email?: string }> {
    // Try to find by email first (most common case)
    let user = await this.usersService.findByEmail(identifier);

    // If not found by email and identifier looks like a phone, try phone lookup
    // Note: You'll need to implement findByPhone in UsersService if you want phone lookup
    // For now, we'll just check email

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    return this.jwtService.sign(payload);
  }
}
