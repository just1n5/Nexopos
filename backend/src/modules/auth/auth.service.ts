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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly betaKeysService: BetaKeysService,
    private readonly tenantsService: TenantsService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registro completo de nueva organización + usuario admin
   * Se ejecuta en transacción para garantizar consistencia
   */
  async register(registerDto: RegisterDto): Promise<{ user: User; accessToken: string }> {
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
        tenantId: tenant.id,
        isOwner: true,
        documentId: registerDto.documentId,
        phoneNumber: registerDto.phoneNumber,
      });

      // 3. Marcar beta key como usada
      await this.betaKeysService.markAsUsed(registerDto.betaKey, tenant.id);

      await queryRunner.commitTransaction();

      // Generar token JWT
      const safeUser = await this.usersService.findById(user.id);
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

      return { user: safeUser, accessToken };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const safeUser = await this.usersService.findById(user.id);
    const accessToken = this.generateAccessToken(safeUser);
    return { user: safeUser, accessToken };
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValid = await this.usersService.validatePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return user;
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
