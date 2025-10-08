import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, BusinessType } from './entities/tenant.entity';
import { User, UserRole } from '../users/entities/user.entity';

export interface CreateTenantDto {
  businessName: string;
  nit: string;
  businessType: BusinessType;
  address: string;
  phone: string;
  email: string;
  betaKeyUsed: string;
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo tenant (organización)
   */
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Verificar que el NIT no exista
    const existingTenant = await this.tenantRepository.findOne({
      where: { nit: createTenantDto.nit },
    });

    if (existingTenant) {
      throw new ConflictException('Ya existe una organización registrada con este NIT');
    }

    const tenant = this.tenantRepository.create(createTenantDto);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Obtiene todos los tenants
   */
  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene un tenant por ID
   */
  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException('Organización no encontrada');
    }

    return tenant;
  }

  /**
   * Verifica si un tenant puede crear un usuario con un rol específico
   */
  async canCreateUser(tenantId: string, role: UserRole): Promise<boolean> {
    const tenant = await this.findOne(tenantId);
    const users = await this.userRepository.find({
      where: { tenantId, isActive: true },
    });

    const currentAdmins = users.filter((u) => u.role === UserRole.ADMIN).length;
    const currentManagers = users.filter((u) => u.role === UserRole.MANAGER).length;
    const currentCashiers = users.filter((u) => u.role === UserRole.CASHIER).length;

    switch (role) {
      case UserRole.ADMIN:
        return currentAdmins < tenant.maxAdmins;
      case UserRole.MANAGER:
        return currentManagers < tenant.maxManagers;
      case UserRole.CASHIER:
        return currentCashiers < tenant.maxCashiers;
      default:
        return false;
    }
  }

  /**
   * Obtiene el conteo de usuarios por rol en un tenant
   */
  async getUserCountByRole(tenantId: string) {
    const users = await this.userRepository.find({
      where: { tenantId, isActive: true },
    });

    const tenant = await this.findOne(tenantId);

    return {
      admins: {
        current: users.filter((u) => u.role === UserRole.ADMIN).length,
        max: tenant.maxAdmins,
      },
      managers: {
        current: users.filter((u) => u.role === UserRole.MANAGER).length,
        max: tenant.maxManagers,
      },
      cashiers: {
        current: users.filter((u) => u.role === UserRole.CASHIER).length,
        max: tenant.maxCashiers,
      },
    };
  }

  /**
   * Desactiva un tenant
   */
  async deactivate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isActive = false;
    return this.tenantRepository.save(tenant);
  }

  /**
   * Activa un tenant
   */
  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isActive = true;
    return this.tenantRepository.save(tenant);
  }
}
