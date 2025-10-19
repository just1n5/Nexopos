import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccounts, AccountType, AccountNature } from '../entities/chart-of-accounts.entity';

/**
 * Servicio para gestión del Plan de Cuentas (Mini-PUC)
 *
 * Responsabilidades:
 * - Gestionar el catálogo de cuentas contables
 * - Proveer métodos de búsqueda por código PUC
 * - Activar/desactivar cuentas
 * - Validar existencia de cuentas necesarias
 */
@Injectable()
export class ChartOfAccountsService {
  constructor(
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>
  ) {}

  /**
   * ========================================
   * OBTENER CUENTAS
   * ========================================
   */

  /**
   * Obtener todas las cuentas activas de un tenant
   */
  async findAll(tenantId: string): Promise<ChartOfAccounts[]> {
    return this.chartOfAccountsRepository.find({
      where: { tenantId, isActive: true },
      order: { code: 'ASC' }
    });
  }

  /**
   * Alias para compatibilidad
   */
  async findByTenant(tenantId: string): Promise<ChartOfAccounts[]> {
    return this.findAll(tenantId);
  }

  /**
   * Obtener cuenta por código PUC
   */
  async findByCode(tenantId: string, code: string): Promise<ChartOfAccounts | null> {
    return this.chartOfAccountsRepository.findOne({
      where: { tenantId, code }
    });
  }

  /**
   * Obtener cuenta por código PUC o lanzar error si no existe
   */
  async getByCodeOrFail(tenantId: string, code: string): Promise<ChartOfAccounts> {
    const account = await this.findByCode(tenantId, code);

    if (!account) {
      throw new NotFoundException(
        `Cuenta contable con código ${code} no encontrada. ` +
        'Por favor ejecute el seed del Plan de Cuentas.'
      );
    }

    return account;
  }

  /**
   * Obtener cuenta por ID
   */
  async findById(id: string): Promise<ChartOfAccounts | null> {
    return this.chartOfAccountsRepository.findOne({
      where: { id }
    });
  }

  /**
   * Obtener cuentas por tipo (Activo, Pasivo, etc.)
   */
  async findByType(tenantId: string, type: AccountType): Promise<ChartOfAccounts[]> {
    return this.chartOfAccountsRepository.find({
      where: { tenantId, type: type, isActive: true },
      order: { code: 'ASC' }
    });
  }

  /**
   * ========================================
   * CREAR Y ACTUALIZAR CUENTAS
   * ========================================
   */

  /**
   * Crear nueva cuenta contable
   */
  async create(
    tenantId: string,
    accountData: {
      code: string;
      name: string;
      type: AccountType;
      nature: AccountNature;
      description?: string;
    }
  ): Promise<ChartOfAccounts> {
    // Validar que no exista el código
    const existing = await this.findByCode(tenantId, accountData.code);
    if (existing) {
      throw new BadRequestException(
        `Ya existe una cuenta con el código ${accountData.code}`
      );
    }

    // Validar formato de código PUC
    if (!this.isValidPUCCode(accountData.code)) {
      throw new BadRequestException(
        'El código PUC debe ser numérico y tener entre 4 y 6 dígitos'
      );
    }

    const account = this.chartOfAccountsRepository.create({
      code: accountData.code,
      name: accountData.name,
      type: accountData.type,
      nature: accountData.nature,
      description: accountData.description,
      tenantId,
      isActive: true
    });

    return this.chartOfAccountsRepository.save(account);
  }

  /**
   * Actualizar una cuenta
   */
  async update(
    id: string,
    updateData: {
      name?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<ChartOfAccounts> {
    const account = await this.findById(id);

    if (!account) {
      throw new NotFoundException(`Cuenta con ID ${id} no encontrada`);
    }

    Object.assign(account, updateData);

    return this.chartOfAccountsRepository.save(account);
  }

  /**
   * ========================================
   * ACTIVAR/DESACTIVAR CUENTAS
   * ========================================
   */

  /**
   * Activar una cuenta
   */
  async activate(id: string): Promise<ChartOfAccounts> {
    return this.update(id, { isActive: true });
  }

  /**
   * Desactivar una cuenta
   */
  async deactivate(id: string): Promise<ChartOfAccounts> {
    return this.update(id, { isActive: false });
  }

  /**
   * ========================================
   * CUENTAS ESPECIALES
   * ========================================
   */

  /**
   * Obtener cuenta de Caja (1105)
   */
  async getCashAccount(tenantId: string): Promise<ChartOfAccounts> {
    return this.getByCodeOrFail(tenantId, '1105');
  }

  /**
   * Obtener cuenta de Bancos (1110)
   */
  async getBankAccount(tenantId: string): Promise<ChartOfAccounts> {
    return this.getByCodeOrFail(tenantId, '1110');
  }

  /**
   * Obtener cuenta de Clientes (1305)
   */
  async getAccountsReceivableAccount(tenantId: string): Promise<ChartOfAccounts> {
    return this.getByCodeOrFail(tenantId, '1305');
  }

  /**
   * Obtener cuenta de Inventario (1435)
   */
  async getInventoryAccount(tenantId: string): Promise<ChartOfAccounts> {
    return this.getByCodeOrFail(tenantId, '1435');
  }

  /**
   * Obtener cuenta de Ingresos por Ventas (4135)
   */
  async getSalesIncomeAccount(tenantId: string): Promise<ChartOfAccounts> {
    return this.getByCodeOrFail(tenantId, '4135');
  }

  /**
   * Obtener cuenta de IVA por Pagar (2408)
   */
  async getIVAPayableAccount(tenantId: string): Promise<ChartOfAccounts> {
    return this.getByCodeOrFail(tenantId, '2408');
  }

  /**
   * Obtener cuenta de Costo de Ventas (6135)
   */
  async getCostOfSalesAccount(tenantId: string): Promise<ChartOfAccounts> {
    return this.getByCodeOrFail(tenantId, '6135');
  }

  /**
   * ========================================
   * VALIDACIONES Y UTILIDADES
   * ========================================
   */

  /**
   * Validar que todas las cuentas esenciales existan
   */
  async validateEssentialAccounts(tenantId: string): Promise<{
    isValid: boolean;
    missingAccounts: string[];
  }> {
    const essentialCodes = [
      '1105', // Caja
      '1110', // Bancos
      '1305', // Clientes
      '1435', // Inventario
      '2408', // IVA por Pagar
      '4135', // Ingresos por Ventas
      '6135'  // Costo de Ventas
    ];

    const missingAccounts: string[] = [];

    for (const code of essentialCodes) {
      const account = await this.findByCode(tenantId, code);
      if (!account) {
        missingAccounts.push(code);
      }
    }

    return {
      isValid: missingAccounts.length === 0,
      missingAccounts
    };
  }

  /**
   * Validar formato de código PUC
   */
  private isValidPUCCode(code: string): boolean {
    // Código PUC debe ser numérico y tener entre 4 y 6 dígitos
    return /^\d{4,6}$/.test(code);
  }

  /**
   * ========================================
   * BÚSQUEDAS Y FILTROS
   * ========================================
   */

  /**
   * Buscar cuentas por nombre
   */
  async searchByName(tenantId: string, searchTerm: string): Promise<ChartOfAccounts[]> {
    return this.chartOfAccountsRepository
      .createQueryBuilder('account')
      .where('account.tenantId = :tenantId', { tenantId })
      .andWhere('account.isActive = :isActive', { isActive: true })
      .andWhere('LOWER(account.name) LIKE LOWER(:searchTerm)', {
        searchTerm: `%${searchTerm}%`
      })
      .orderBy('account.code', 'ASC')
      .getMany();
  }

  /**
   * Obtener estructura jerárquica de cuentas
   */
  async getAccountHierarchy(tenantId: string): Promise<any> {
    const accounts = await this.findAll(tenantId);

    // Agrupar por tipo de cuenta
    const hierarchy = {
      ASSET: accounts.filter(a => a.type === AccountType.ASSET),
      LIABILITY: accounts.filter(a => a.type === AccountType.LIABILITY),
      EQUITY: accounts.filter(a => a.type === AccountType.EQUITY),
      INCOME: accounts.filter(a => a.type === AccountType.INCOME),
      EXPENSE: accounts.filter(a => a.type === AccountType.EXPENSE),
      COST: accounts.filter(a => a.type === AccountType.COST)
    };

    return hierarchy;
  }

  /**
   * ========================================
   * ESTADÍSTICAS
   * ========================================
   */

  /**
   * Obtener resumen de cuentas por tipo
   */
  async getAccountsSummary(tenantId: string): Promise<{
    total: number;
    byType: Record<AccountType, number>;
    active: number;
    inactive: number;
  }> {
    const allAccounts = await this.chartOfAccountsRepository.find({
      where: { tenantId }
    });

    const byType: any = {
      [AccountType.ASSET]: 0,
      [AccountType.LIABILITY]: 0,
      [AccountType.EQUITY]: 0,
      [AccountType.INCOME]: 0,
      [AccountType.EXPENSE]: 0,
      [AccountType.COST]: 0
    };

    let active = 0;
    let inactive = 0;

    allAccounts.forEach(account => {
      byType[account.type]++;
      if (account.isActive) {
        active++;
      } else {
        inactive++;
      }
    });

    return {
      total: allAccounts.length,
      byType,
      active,
      inactive
    };
  }
}
