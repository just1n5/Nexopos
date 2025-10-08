import { ConflictException, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, UserRole } from './entities/user.entity';
import { UserAuditService } from './services/user-audit.service';
import { UserAuditAction } from './entities/user-audit.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly auditService: UserAuditService
  ) {}

  private resolveSaltRounds(): number {
    const configuredSaltRounds = Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'));
    return Number.isSafeInteger(configuredSaltRounds) && configuredSaltRounds > 0 ? configuredSaltRounds : 12;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    // Validar límites de usuarios por rol
    const role = createUserDto.role ?? UserRole.CASHIER;
    await this.validateUserLimits(role);

    const passwordHash = await bcrypt.hash(createUserDto.password, this.resolveSaltRounds());

    const user = this.usersRepository.create({
      ...createUserDto,
      password: passwordHash,
      role
    });

    return this.usersRepository.save(user);
  }

  private async validateUserLimits(role: UserRole): Promise<void> {
    if (role === UserRole.MANAGER) {
      const managersCount = await this.usersRepository.count({
        where: { role: UserRole.MANAGER }
      });

      if (managersCount >= 1) {
        throw new BadRequestException('Solo se puede crear 1 usuario Manager. Ya existe un Manager en el sistema.');
      }
    }

    if (role === UserRole.CASHIER) {
      const cashiersCount = await this.usersRepository.count({
        where: { role: UserRole.CASHIER }
      });

      if (cashiersCount >= 2) {
        throw new BadRequestException('Solo se pueden crear 2 usuarios Cajero. Límite alcanzado.');
      }
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Si se está cambiando el rol, validar límites
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      await this.validateUserLimitsForUpdate(id, user.role, updateUserDto.role);
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, this.resolveSaltRounds());
    }

    Object.assign(user, { ...updateUserDto, password: user.password });
    return this.usersRepository.save(user);
  }

  private async validateUserLimitsForUpdate(
    userId: string,
    currentRole: UserRole,
    newRole: UserRole
  ): Promise<void> {
    // Validar límites del nuevo rol (excluyendo el usuario actual)
    if (newRole === UserRole.MANAGER) {
      const managersCount = await this.usersRepository.count({
        where: { role: UserRole.MANAGER }
      });

      if (managersCount >= 1) {
        throw new BadRequestException('Solo se puede tener 1 usuario Manager. Ya existe un Manager en el sistema.');
      }
    }

    if (newRole === UserRole.CASHIER) {
      const cashiersCount = await this.usersRepository.count({
        where: { role: UserRole.CASHIER }
      });

      if (cashiersCount >= 2) {
        throw new BadRequestException('Solo se pueden tener 2 usuarios Cajero. Límite alcanzado.');
      }
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('User not found.');
    }
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async toggleActive(id: string, requestingUserId: string): Promise<User> {
    const user = await this.findById(id);

    // No se puede desactivar a sí mismo
    if (id === requestingUserId) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    // Validar que no sea el último admin activo
    if (user.role === UserRole.ADMIN && user.isActive) {
      const activeAdminsCount = await this.usersRepository.count({
        where: { role: UserRole.ADMIN, isActive: true }
      });

      if (activeAdminsCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active admin');
      }
    }

    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Actualizar con nueva contraseña
    user.password = await bcrypt.hash(changePasswordDto.newPassword, this.resolveSaltRounds());
    await this.usersRepository.save(user);
  }

  async validateUserCanManage(requestingUser: User, targetUserId?: string, targetRole?: UserRole): Promise<void> {
    // Admin puede gestionar a todos
    if (requestingUser.role === UserRole.ADMIN) {
      return;
    }

    // Manager solo puede gestionar cajeros
    if (requestingUser.role === UserRole.MANAGER) {
      if (targetRole && targetRole !== UserRole.CASHIER) {
        throw new ForbiddenException('Managers can only manage cashiers');
      }

      // Si es edición, validar que el usuario target sea cajero
      if (targetUserId) {
        const targetUser = await this.findById(targetUserId);
        if (targetUser.role !== UserRole.CASHIER) {
          throw new ForbiddenException('Managers can only manage cashiers');
        }
      }

      return;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async removeWithValidation(id: string, requestingUser: User): Promise<void> {
    const userToDelete = await this.findById(id);

    // No se puede eliminar a sí mismo
    if (id === requestingUser.id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Validar permisos según rol
    await this.validateUserCanManage(requestingUser, id);

    // Validar que no sea el último admin
    if (userToDelete.role === UserRole.ADMIN) {
      const adminsCount = await this.usersRepository.count({
        where: { role: UserRole.ADMIN }
      });

      if (adminsCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin');
      }
    }

    await this.remove(id);
  }
}
