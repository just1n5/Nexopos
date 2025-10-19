import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry, JournalEntryType, JournalEntryStatus } from '../entities/journal-entry.entity';
import { JournalEntryLine, MovementType } from '../entities/journal-entry-line.entity';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { Sale } from '../../sales/entities/sale.entity';
import { Expense } from '../entities/expense.entity';

/**
 * Servicio para la gestión de Asientos Contables
 * Este es el MOTOR DE CONTABILIDAD AUTOMÁTICA
 *
 * PRINCIPIO FUNDAMENTAL: Partida Doble
 * Cada asiento SIEMPRE debe cumplir: DÉBITOS = CRÉDITOS
 *
 * Responsabilidades:
 * - Crear asientos contables automáticos desde transacciones de negocio
 * - Validar que los asientos cumplan con partida doble
 * - Generar números consecutivos de asientos
 * - Mapear acciones de usuario a cuentas del PUC
 */
@Injectable()
export class JournalEntryService {
  constructor(
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLineRepository: Repository<JournalEntryLine>,
    private chartOfAccountsService: ChartOfAccountsService
  ) {}

  /**
   * ========================================
   * ASIENTO PARA VENTA EN EFECTIVO CON IVA
   * ========================================
   *
   * Ejemplo: Venta de $119,000 (subtotal $100,000 + IVA $19,000)
   *
   * DÉBITO:  1105 - Caja                 $119,000
   * CRÉDITO: 4135 - Ingresos             $100,000
   * CRÉDITO: 2408 - IVA por Pagar        $ 19,000
   * DÉBITO:  6135 - Costo de Ventas      $ 70,000  (costo del inventario)
   * CRÉDITO: 1435 - Inventario           $ 70,000
   *
   * Total Débitos:  $189,000
   * Total Créditos: $189,000 ✅
   */
  async createSaleEntry(
    sale: Sale,
    tenantId: string,
    userId: string
  ): Promise<JournalEntry> {
    const lines: Partial<JournalEntryLine>[] = [];

    // 1. DÉBITO a la cuenta de pago (Caja o Bancos)
    const paymentAccountCode = this.getPaymentAccountCode(sale.payments[0]?.method || 'CASH');
    const paymentAccount = await this.chartOfAccountsService.findByCode(tenantId, paymentAccountCode);

    lines.push({
      accountId: paymentAccount.id,
      movementType: MovementType.DEBIT,
      amount: Number(sale.total),
      description: `Venta ${sale.saleNumber}`,
      lineOrder: 1
    });

    // 2. CRÉDITO a Ingresos (por el subtotal)
    const incomeAccount = await this.chartOfAccountsService.findByCode(tenantId, '4135');
    lines.push({
      accountId: incomeAccount.id,
      movementType: MovementType.CREDIT,
      amount: Number(sale.subtotal),
      description: `Ingreso por venta ${sale.saleNumber}`,
      lineOrder: 2
    });

    // 3. CRÉDITO a IVA por Pagar (si hay IVA)
    if (Number(sale.taxAmount) > 0) {
      const ivaAccount = await this.chartOfAccountsService.findByCode(tenantId, '2408');
      lines.push({
        accountId: ivaAccount.id,
        movementType: MovementType.CREDIT,
        amount: Number(sale.taxAmount),
        description: `IVA generado en venta ${sale.saleNumber}`,
        lineOrder: 3
      });
    }

    // 4. DÉBITO a Costo de Ventas y CRÉDITO a Inventario
    // Calculamos el costo total de los items vendidos
    let totalCost = 0;
    if (sale.items && sale.items.length > 0) {
      totalCost = sale.items.reduce((sum, item) => {
        // El costo debería venir del inventario
        // Por ahora usamos un estimado (60% del precio de venta)
        const estimatedCost = Number(item.unitPrice) * 0.6 * item.quantity;
        return sum + estimatedCost;
      }, 0);

      if (totalCost > 0) {
        // DÉBITO: Costo de Ventas
        const costAccount = await this.chartOfAccountsService.findByCode(tenantId, '6135');
        lines.push({
          accountId: costAccount.id,
          movementType: MovementType.DEBIT,
          amount: totalCost,
          description: `Costo de venta ${sale.saleNumber}`,
          lineOrder: 4
        });

        // CRÉDITO: Inventario
        const inventoryAccount = await this.chartOfAccountsService.findByCode(tenantId, '1435');
        lines.push({
          accountId: inventoryAccount.id,
          movementType: MovementType.CREDIT,
          amount: totalCost,
          description: `Salida de inventario - venta ${sale.saleNumber}`,
          lineOrder: 5
        });
      }
    }

    // Crear el asiento
    return this.createJournalEntry({
      tenantId,
      userId,
      type: JournalEntryType.SALE,
      entryDate: sale.createdAt,
      description: `Venta en ${paymentAccountCode === '1105' ? 'efectivo' : 'banco'} - ${sale.saleNumber}`,
      referenceId: sale.id,
      referenceType: 'Sale',
      referenceNumber: sale.saleNumber,
      lines
    });
  }

  /**
   * ========================================
   * ASIENTO PARA GASTO CON IVA DESCONTABLE
   * ========================================
   *
   * Ejemplo: Pago de servicios públicos $238,000 (subtotal $200,000 + IVA $38,000)
   *
   * DÉBITO:  5135 - Servicios             $200,000
   * DÉBITO:  2408 - IVA por Pagar         $ 38,000  (contra-pasivo, descontable)
   * CRÉDITO: 1110 - Bancos                $238,000
   *
   * Total Débitos:  $238,000
   * Total Créditos: $238,000 ✅
   */
  async createExpenseEntry(
    expense: Expense,
    tenantId: string,
    userId: string
  ): Promise<JournalEntry> {
    const lines: Partial<JournalEntryLine>[] = [];

    // 1. DÉBITO a la cuenta de gasto
    const expenseAccountCode = expense.getPUCCode();
    const expenseAccount = await this.chartOfAccountsService.findByCode(tenantId, expenseAccountCode);

    lines.push({
      accountId: expenseAccount.id,
      movementType: MovementType.DEBIT,
      amount: Number(expense.subtotal),
      description: `${expense.type} - ${expense.expenseNumber}`,
      lineOrder: 1
    });

    // 2. DÉBITO a IVA Descontable (si hay IVA)
    if (Number(expense.taxAmount) > 0) {
      const ivaAccount = await this.chartOfAccountsService.findByCode(tenantId, '2408');
      lines.push({
        accountId: ivaAccount.id,
        movementType: MovementType.DEBIT,
        amount: Number(expense.taxAmount),
        description: `IVA descontable en ${expense.expenseNumber}`,
        lineOrder: 2
      });
    }

    // 3. CRÉDITO a la cuenta de pago
    const paymentAccountCode = expense.getPaymentAccountPUC();
    const paymentAccount = await this.chartOfAccountsService.findByCode(tenantId, paymentAccountCode);

    lines.push({
      accountId: paymentAccount.id,
      movementType: MovementType.CREDIT,
      amount: Number(expense.total),
      description: `Pago de ${expense.type}`,
      lineOrder: 3
    });

    // Crear el asiento
    return this.createJournalEntry({
      tenantId,
      userId,
      type: JournalEntryType.EXPENSE,
      entryDate: expense.expenseDate,
      description: `Gasto: ${expense.getIcon()} ${expense.type} - ${expense.expenseNumber}`,
      referenceId: expense.id,
      referenceType: 'Expense',
      referenceNumber: expense.expenseNumber,
      lines
    });
  }

  /**
   * ========================================
   * ASIENTO PARA COMPRA DE INVENTARIO
   * ========================================
   *
   * Ejemplo: Compra de mercancía $595,000 (subtotal $500,000 + IVA $95,000)
   *
   * DÉBITO:  1435 - Inventario            $500,000
   * DÉBITO:  2408 - IVA por Pagar         $ 95,000  (descontable)
   * CRÉDITO: 2205 - Proveedores           $595,000  (si es a crédito)
   * O
   * CRÉDITO: 1110 - Bancos                $595,000  (si es de contado)
   */
  async createPurchaseEntry(
    purchaseData: {
      id: string;
      purchaseNumber: string;
      date: Date;
      subtotal: number;
      taxAmount: number;
      total: number;
      paymentMethod: 'CASH' | 'BANK' | 'CREDIT';
    },
    tenantId: string,
    userId: string
  ): Promise<JournalEntry> {
    const lines: Partial<JournalEntryLine>[] = [];

    // 1. DÉBITO a Inventario
    const inventoryAccount = await this.chartOfAccountsService.findByCode(tenantId, '1435');
    lines.push({
      accountId: inventoryAccount.id,
      movementType: MovementType.DEBIT,
      amount: purchaseData.subtotal,
      description: `Compra de inventario ${purchaseData.purchaseNumber}`,
      lineOrder: 1
    });

    // 2. DÉBITO a IVA Descontable
    if (purchaseData.taxAmount > 0) {
      const ivaAccount = await this.chartOfAccountsService.findByCode(tenantId, '2408');
      lines.push({
        accountId: ivaAccount.id,
        movementType: MovementType.DEBIT,
        amount: purchaseData.taxAmount,
        description: `IVA descontable en compra ${purchaseData.purchaseNumber}`,
        lineOrder: 2
      });
    }

    // 3. CRÉDITO según método de pago
    let creditAccountCode: string;
    if (purchaseData.paymentMethod === 'CREDIT') {
      creditAccountCode = '2205'; // Proveedores
    } else if (purchaseData.paymentMethod === 'CASH') {
      creditAccountCode = '1105'; // Caja
    } else {
      creditAccountCode = '1110'; // Bancos
    }

    const paymentAccount = await this.chartOfAccountsService.findByCode(tenantId, creditAccountCode);
    lines.push({
      accountId: paymentAccount.id,
      movementType: MovementType.CREDIT,
      amount: purchaseData.total,
      description: `Pago de compra ${purchaseData.purchaseNumber}`,
      lineOrder: 3
    });

    return this.createJournalEntry({
      tenantId,
      userId,
      type: JournalEntryType.PURCHASE,
      entryDate: purchaseData.date,
      description: `Compra de inventario - ${purchaseData.purchaseNumber}`,
      referenceId: purchaseData.id,
      referenceType: 'Purchase',
      referenceNumber: purchaseData.purchaseNumber,
      lines
    });
  }

  /**
   * ========================================
   * ASIENTO PARA VENTA A CRÉDITO CON RETENCIÓN
   * ========================================
   *
   * Ejemplo: Venta a crédito $1,190,000 con retención de $40,000
   *
   * DÉBITO:  1305 - Clientes              $1,190,000
   * CRÉDITO: 4135 - Ingresos              $1,000,000
   * CRÉDITO: 2408 - IVA por Pagar         $  190,000
   *
   * Al recibir el pago:
   * DÉBITO:  1110 - Bancos                $1,150,000
   * DÉBITO:  135515 - ReteFuente          $   40,000  (a favor)
   * CRÉDITO: 1305 - Clientes              $1,190,000
   */
  async createCreditSaleWithWithholding(
    sale: Sale,
    withholdingAmount: number,
    tenantId: string,
    userId: string
  ): Promise<JournalEntry> {
    const lines: Partial<JournalEntryLine>[] = [];

    // 1. DÉBITO a Clientes
    const clientsAccount = await this.chartOfAccountsService.findByCode(tenantId, '1305');
    lines.push({
      accountId: clientsAccount.id,
      movementType: MovementType.DEBIT,
      amount: Number(sale.total),
      description: `Venta a crédito ${sale.saleNumber}`,
      lineOrder: 1
    });

    // 2. CRÉDITO a Ingresos
    const incomeAccount = await this.chartOfAccountsService.findByCode(tenantId, '4135');
    lines.push({
      accountId: incomeAccount.id,
      movementType: MovementType.CREDIT,
      amount: Number(sale.subtotal),
      description: `Ingreso por venta ${sale.saleNumber}`,
      lineOrder: 2
    });

    // 3. CRÉDITO a IVA por Pagar
    if (Number(sale.taxAmount) > 0) {
      const ivaAccount = await this.chartOfAccountsService.findByCode(tenantId, '2408');
      lines.push({
        accountId: ivaAccount.id,
        movementType: MovementType.CREDIT,
        amount: Number(sale.taxAmount),
        description: `IVA generado en venta ${sale.saleNumber}`,
        lineOrder: 3
      });
    }

    return this.createJournalEntry({
      tenantId,
      userId,
      type: JournalEntryType.SALE_CREDIT,
      entryDate: sale.createdAt,
      description: `Venta a crédito con retención - ${sale.saleNumber}`,
      referenceId: sale.id,
      referenceType: 'Sale',
      referenceNumber: sale.saleNumber,
      lines
    });
  }

  /**
   * ========================================
   * MÉTODO AUXILIAR: Crear asiento genérico
   * ========================================
   */
  private async createJournalEntry(data: {
    tenantId: string;
    userId: string;
    type: JournalEntryType;
    entryDate: Date;
    description: string;
    referenceId?: string;
    referenceType?: string;
    referenceNumber?: string;
    lines: Partial<JournalEntryLine>[];
  }): Promise<JournalEntry> {
    // Validar partida doble
    if (!this.validateBalance(data.lines)) {
      const diff = this.calculateDifference(data.lines);
      throw new BadRequestException(
        `El asiento no cuadra. Diferencia: $${diff.toFixed(2)}. ` +
        `Débitos: $${this.sumDebits(data.lines)}, Créditos: $${this.sumCredits(data.lines)}`
      );
    }

    // Calcular totales
    const totalDebits = this.sumDebits(data.lines);
    const totalCredits = this.sumCredits(data.lines);

    // Generar número consecutivo
    const entryNumber = await this.generateEntryNumber(data.tenantId);

    // Crear el asiento
    const entry = this.journalEntryRepository.create({
      entryNumber,
      tenantId: data.tenantId,
      type: data.type,
      status: JournalEntryStatus.CONFIRMED,
      entryDate: data.entryDate,
      description: data.description,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      referenceNumber: data.referenceNumber,
      totalDebits,
      totalCredits,
      isBalanced: true,
      createdBy: data.userId,
      confirmedBy: data.userId,
      confirmedAt: new Date()
    });

    const savedEntry = await this.journalEntryRepository.save(entry);

    // Crear las líneas
    const linePromises = data.lines.map((lineData, index) => {
      const line = this.journalEntryLineRepository.create({
        ...lineData,
        journalEntryId: savedEntry.id,
        lineOrder: index + 1
      });
      return this.journalEntryLineRepository.save(line);
    });

    await Promise.all(linePromises);

    // Retornar el asiento completo con líneas
    return this.journalEntryRepository.findOne({
      where: { id: savedEntry.id },
      relations: ['lines', 'lines.account']
    });
  }

  /**
   * ========================================
   * MÉTODOS DE VALIDACIÓN Y UTILIDADES
   * ========================================
   */

  private validateBalance(lines: Partial<JournalEntryLine>[]): boolean {
    const totalDebits = this.sumDebits(lines);
    const totalCredits = this.sumCredits(lines);
    // Tolerancia de 1 centavo por errores de redondeo
    return Math.abs(totalDebits - totalCredits) < 0.01;
  }

  private sumDebits(lines: Partial<JournalEntryLine>[]): number {
    return lines
      .filter(l => l.movementType === MovementType.DEBIT)
      .reduce((sum, l) => sum + Number(l.amount), 0);
  }

  private sumCredits(lines: Partial<JournalEntryLine>[]): number {
    return lines
      .filter(l => l.movementType === MovementType.CREDIT)
      .reduce((sum, l) => sum + Number(l.amount), 0);
  }

  private calculateDifference(lines: Partial<JournalEntryLine>[]): number {
    return this.sumDebits(lines) - this.sumCredits(lines);
  }

  private async generateEntryNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.journalEntryRepository.count({
      where: { tenantId }
    });
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `JE-${year}-${nextNumber}`;
  }

  /**
   * ========================================
   * ASIENTO PARA CIERRE DE CAJA
   * ========================================
   *
   * Cuando se cierra la caja y se deposita en el banco
   *
   * Ejemplo: Cierre con $500,000 en efectivo que se deposita al banco
   *
   * DÉBITO:  1110 - Bancos                $500,000
   * CRÉDITO: 1105 - Caja                  $500,000
   *
   * Total Débitos:  $500,000
   * Total Créditos: $500,000 ✅
   */
  async createCashRegisterCloseEntry(
    cashRegisterSession: any, // CashRegisterSession entity
    tenantId: string,
    userId: string,
    depositedToBank: boolean = true
  ): Promise<JournalEntry> {
    const lines: Partial<JournalEntryLine>[] = [];

    // Solo generar asiento si hay efectivo para transferir
    const cashAmount = Number(cashRegisterSession.actualCash || cashRegisterSession.closingBalance || 0);

    if (cashAmount <= 0) {
      throw new BadRequestException('No hay efectivo para registrar en el cierre de caja');
    }

    if (depositedToBank) {
      // 1. DÉBITO a Bancos (el dinero se deposita)
      const bankAccount = await this.chartOfAccountsService.findByCode(tenantId, '1110');
      lines.push({
        accountId: bankAccount.id,
        movementType: MovementType.DEBIT,
        amount: cashAmount,
        description: `Depósito de cierre de caja ${cashRegisterSession.sessionNumber}`,
        lineOrder: 1
      });

      // 2. CRÉDITO a Caja (sale el efectivo de caja)
      const cashAccount = await this.chartOfAccountsService.findByCode(tenantId, '1105');
      lines.push({
        accountId: cashAccount.id,
        movementType: MovementType.CREDIT,
        amount: cashAmount,
        description: `Cierre de caja ${cashRegisterSession.sessionNumber}`,
        lineOrder: 2
      });
    }

    // Si hay discrepancia (sobrante o faltante), registrarla
    const discrepancy = Number(cashRegisterSession.actualCash) - Number(cashRegisterSession.expectedCash);

    if (Math.abs(discrepancy) > 0.01) { // Tolerancia de 1 centavo
      if (discrepancy > 0) {
        // SOBRANTE - Se registra como ingreso
        const miscIncomeAccount = await this.chartOfAccountsService.findByCode(tenantId, '4295'); // Ingresos diversos
        lines.push({
          accountId: miscIncomeAccount.id,
          movementType: MovementType.CREDIT,
          amount: Math.abs(discrepancy),
          description: `Sobrante en cierre de caja ${cashRegisterSession.sessionNumber}`,
          lineOrder: 3
        });

        // Débito adicional a Bancos o Caja
        const targetAccount = depositedToBank
          ? await this.chartOfAccountsService.findByCode(tenantId, '1110')
          : await this.chartOfAccountsService.findByCode(tenantId, '1105');

        lines.push({
          accountId: targetAccount.id,
          movementType: MovementType.DEBIT,
          amount: Math.abs(discrepancy),
          description: `Sobrante en caja ${cashRegisterSession.sessionNumber}`,
          lineOrder: 4
        });
      } else {
        // FALTANTE - Se registra como gasto
        const miscExpenseAccount = await this.chartOfAccountsService.findByCode(tenantId, '5195'); // Gastos diversos
        lines.push({
          accountId: miscExpenseAccount.id,
          movementType: MovementType.DEBIT,
          amount: Math.abs(discrepancy),
          description: `Faltante en cierre de caja ${cashRegisterSession.sessionNumber}`,
          lineOrder: 3
        });

        // Crédito adicional a Bancos o Caja
        const targetAccount = depositedToBank
          ? await this.chartOfAccountsService.findByCode(tenantId, '1110')
          : await this.chartOfAccountsService.findByCode(tenantId, '1105');

        lines.push({
          accountId: targetAccount.id,
          movementType: MovementType.CREDIT,
          amount: Math.abs(discrepancy),
          description: `Faltante en caja ${cashRegisterSession.sessionNumber}`,
          lineOrder: 4
        });
      }
    }

    return this.createJournalEntry({
      tenantId,
      userId,
      type: JournalEntryType.ADJUSTMENT,
      entryDate: cashRegisterSession.closedAt || new Date(),
      description: `Cierre de caja ${cashRegisterSession.sessionNumber}`,
      referenceId: cashRegisterSession.id,
      referenceType: 'CashRegisterSession',
      referenceNumber: cashRegisterSession.sessionNumber,
      lines
    });
  }

  /**
   * ========================================
   * MÉTODOS PRIVADOS DE UTILIDAD
   * ========================================
   */

  /**
   * Obtiene el código PUC de la cuenta de pago según el método
   */
  private getPaymentAccountCode(method: string): string {
    const map: Record<string, string> = {
      'CASH': '1105',      // Caja
      'BANK': '1110',      // Bancos
      'CARD': '1110',      // Bancos (tarjeta se deposita en banco)
      'TRANSFER': '1110',  // Bancos
      'NEQUI': '1110',     // Bancos (billetera digital)
      'DAVIPLATA': '1110'  // Bancos
    };
    return map[method] || '1105';
  }

  /**
   * Buscar asientos por referencia
   */
  async findByReference(
    tenantId: string,
    referenceId: string,
    referenceType: string
  ): Promise<JournalEntry[]> {
    return this.journalEntryRepository.find({
      where: { tenantId, referenceId, referenceType },
      relations: ['lines', 'lines.account'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Obtener asiento por ID
   */
  async findById(id: string): Promise<JournalEntry> {
    return this.journalEntryRepository.findOne({
      where: { id },
      relations: ['lines', 'lines.account']
    });
  }

  /**
   * Alias para findById (compatibilidad con controller)
   */
  async findOne(id: string, tenantId: string): Promise<JournalEntry> {
    return this.journalEntryRepository.findOne({
      where: { id, tenantId },
      relations: ['lines', 'lines.account']
    });
  }

  /**
   * Obtener todos los asientos de un tenant con filtros opcionales
   */
  async findAll(
    tenantId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      entryType?: string;
    }
  ): Promise<JournalEntry[]> {
    const where: any = { tenantId };

    if (filters?.entryType) {
      where.entryType = filters.entryType;
    }

    const queryBuilder = this.journalEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.lines', 'lines')
      .leftJoinAndSelect('lines.account', 'account')
      .where(where);

    if (filters?.startDate) {
      queryBuilder.andWhere('entry.entryDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('entry.entryDate <= :endDate', { endDate: filters.endDate });
    }

    return queryBuilder
      .orderBy('entry.entryDate', 'DESC')
      .addOrderBy('entry.entryNumber', 'DESC')
      .getMany();
  }
}
