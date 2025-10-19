import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from '../../sales/entities/sale.entity';
import { Expense, ExpenseStatus } from '../entities/expense.entity';
import { ChartOfAccounts, AccountType } from '../entities/chart-of-accounts.entity';
import { JournalEntryLine, MovementType } from '../entities/journal-entry-line.entity';
import { TaxCalculationService } from './tax-calculation.service';
import { ExpenseService } from './expense.service';
import {
  DashboardDataDto,
  IVAReportDto,
  ProfitAndLossDto,
  BalanceSheetDto,
  ExpensesByCategoryDto
} from '../dto/accounting-reports.dto';

/**
 * Servicio para generación de reportes contables y fiscales
 *
 * Responsabilidades:
 * - Dashboard con 5 widgets principales
 * - Reporte de IVA para declaración
 * - Estado de Resultados (P&L)
 * - Balance General
 * - Reportes de gastos por categoría
 */
@Injectable()
export class AccountingReportsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLineRepository: Repository<JournalEntryLine>,
    private taxCalculationService: TaxCalculationService,
    private expenseService: ExpenseService
  ) {}

  /**
   * ========================================
   * DASHBOARD PRINCIPAL - LOS 5 WIDGETS
   * ========================================
   *
   * Este es el corazón de la UX de "Contabilidad Invisible"
   * Responde las 5 preguntas más importantes del dueño del negocio
   */
  async getDashboardData(
    tenantId: string,
    month: number,
    year: number
  ): Promise<DashboardDataDto> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Ejecutar cálculos en paralelo para mejor rendimiento
    const [
      salesData,
      expensesData,
      cashAndBankData,
      taxProvision
    ] = await Promise.all([
      this.calculateSalesWidget(tenantId, startDate, endDate, month, year),
      this.calculateExpensesWidget(tenantId, startDate, endDate),
      this.calculateAvailableMoneyWidget(tenantId),
      this.taxCalculationService.calculateTaxProvision(tenantId, month, year)
    ]);

    // Widget 3: Ganancia Neta = Ventas - Gastos (antes de impuestos)
    const netProfitValue = salesData.total - expensesData.total;

    return {
      sales: salesData,
      expenses: expensesData,
      netProfit: {
        value: netProfitValue,
        type: netProfitValue >= 0 ? 'positive' : 'negative'
      },
      availableMoney: cashAndBankData,
      taxProvision: {
        total: taxProvision.total,
        breakdown: taxProvision.breakdown
      },
      period: {
        month,
        year,
        monthName: this.getMonthName(month)
      }
    };
  }

  /**
   * Widget 1: Ventas del Mes
   */
  private async calculateSalesWidget(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    currentMonth: number,
    year: number
  ) {
    const sales = await this.saleRepository.find({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: Between(startDate, endDate)
      }
    });

    const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    // Calcular trend comparado con mes anterior
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? year - 1 : year;
    const prevStartDate = new Date(previousYear, previousMonth - 1, 1);
    const prevEndDate = new Date(previousYear, previousMonth, 0, 23, 59, 59);

    const previousSales = await this.saleRepository.find({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: Between(prevStartDate, prevEndDate)
      }
    });

    const previousTotal = previousSales.reduce((sum, sale) => sum + Number(sale.total), 0);

    let trend = 0;
    if (previousTotal > 0) {
      trend = ((total - previousTotal) / previousTotal) * 100;
    }

    return {
      total,
      trend: Number(trend.toFixed(2)),
      comparedTo: 'Mes anterior'
    };
  }

  /**
   * Widget 2: Gastos del Mes con Desglose
   */
  private async calculateExpensesWidget(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const expenses = await this.expenseRepository.find({
      where: {
        tenantId,
        status: ExpenseStatus.PAID,
        expenseDate: Between(startDate, endDate)
      }
    });

    const total = expenses.reduce((sum, exp) => sum + Number(exp.total), 0);

    // Agrupar por categoría (top 3 + otros)
    const byCategory = new Map<string, number>();

    expenses.forEach(exp => {
      const category = this.getCategoryName(exp.type);
      const current = byCategory.get(category) || 0;
      byCategory.set(category, current + Number(exp.total));
    });

    // Ordenar por monto y tomar top 3
    const sortedCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1]);

    const top3 = sortedCategories.slice(0, 3);
    const othersTotal = sortedCategories.slice(3).reduce((sum, [_, amount]) => sum + amount, 0);

    const breakdown = top3.map(([category, amount]) => ({
      category,
      percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
      amount
    }));

    if (othersTotal > 0) {
      breakdown.push({
        category: 'Otros',
        percentage: total > 0 ? Number(((othersTotal / total) * 100).toFixed(1)) : 0,
        amount: othersTotal
      });
    }

    return {
      total,
      breakdown
    };
  }

  /**
   * Widget 4: Dinero Disponible
   */
  private async calculateAvailableMoneyWidget(tenantId: string) {
    // Obtener saldos de Caja (1105) y Bancos (1110)
    const [cajaAccount, bancosAccount] = await Promise.all([
      this.chartOfAccountsRepository.findOne({
        where: { tenantId, code: '1105' }
      }),
      this.chartOfAccountsRepository.findOne({
        where: { tenantId, code: '1110' }
      })
    ]);

    let cash = 0;
    let bank = 0;

    if (cajaAccount) {
      cash = await this.getAccountBalance(cajaAccount.id);
    }

    if (bancosAccount) {
      bank = await this.getAccountBalance(bancosAccount.id);
    }

    return {
      cash,
      bank,
      total: cash + bank
    };
  }

  /**
   * ========================================
   * REPORTE DE IVA PARA DECLARACIÓN
   * ========================================
   */
  async getIVAReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IVAReportDto> {
    return this.taxCalculationService.getIVAReportData(
      tenantId,
      startDate,
      endDate
    ) as Promise<IVAReportDto>;
  }

  /**
   * ========================================
   * ESTADO DE RESULTADOS (P&L)
   * ========================================
   */
  async getProfitAndLoss(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfitAndLossDto> {
    // Ingresos
    const sales = await this.saleRepository.find({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: Between(startDate, endDate)
      }
    });

    const salesTotal = sales.reduce((sum, s) => sum + Number(s.subtotal), 0);
    const otherIncome = 0; // TODO: Implementar otros ingresos

    // Costo de ventas
    const costOfSales = await this.getCostOfSales(tenantId, startDate, endDate);

    // Gastos operacionales
    const expenses = await this.expenseRepository.find({
      where: {
        tenantId,
        status: ExpenseStatus.PAID,
        expenseDate: Between(startDate, endDate)
      }
    });

    let personnel = 0;
    let rent = 0;
    let services = 0;
    let other = 0;

    expenses.forEach(exp => {
      const amount = Number(exp.subtotal); // Sin IVA
      switch (exp.type) {
        case 'PAYROLL':
          personnel += amount;
          break;
        case 'RENT':
          rent += amount;
          break;
        case 'UTILITIES':
        case 'INTERNET_PHONE':
          services += amount;
          break;
        default:
          other += amount;
      }
    });

    const totalExpenses = personnel + rent + services + other;

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        description: this.getPeriodDescription(startDate, endDate)
      },
      income: {
        sales: salesTotal,
        otherIncome,
        total: salesTotal + otherIncome
      },
      costOfSales,
      grossProfit: salesTotal + otherIncome - costOfSales,
      operatingExpenses: {
        personnel,
        rent,
        services,
        other,
        total: totalExpenses
      },
      operatingProfit: salesTotal + otherIncome - costOfSales - totalExpenses,
      netProfit: salesTotal + otherIncome - costOfSales - totalExpenses
    };
  }

  /**
   * ========================================
   * BALANCE GENERAL
   * ========================================
   */
  async getBalanceSheet(
    tenantId: string,
    date: Date
  ): Promise<BalanceSheetDto> {
    // Obtener saldos de cuentas principales
    const [caja, bancos, cuentasPorCobrar, inventario] = await Promise.all([
      this.getAccountBalanceByCode(tenantId, '1105'),
      this.getAccountBalanceByCode(tenantId, '1110'),
      this.getAccountBalanceByCode(tenantId, '1305'),
      this.getAccountBalanceByCode(tenantId, '1435')
    ]);

    const currentAssets = {
      cash: caja,
      bank: bancos,
      accounts_receivable: cuentasPorCobrar,
      inventory: inventario,
      total: caja + bancos + cuentasPorCobrar + inventario
    };

    // Pasivos
    const [cuentasPorPagar, impuestosPorPagar] = await Promise.all([
      this.getAccountBalanceByCode(tenantId, '2205'),
      this.getAccountBalanceByCode(tenantId, '2408')
    ]);

    const currentLiabilities = {
      accounts_payable: cuentasPorPagar,
      taxes_payable: impuestosPorPagar,
      total: cuentasPorPagar + impuestosPorPagar
    };

    // Patrimonio
    const [capital, utilidadRetenida, utilidadEjercicio] = await Promise.all([
      this.getAccountBalanceByCode(tenantId, '3115'),
      0, // TODO: Implementar utilidades retenidas
      this.getAccountBalanceByCode(tenantId, '3605')
    ]);

    const equity = {
      capital,
      retained_earnings: utilidadRetenida,
      current_profit: utilidadEjercicio,
      total: capital + utilidadRetenida + utilidadEjercicio
    };

    return {
      date: date.toISOString().split('T')[0],
      assets: {
        current: currentAssets,
        total: currentAssets.total
      },
      liabilities: {
        current: currentLiabilities,
        total: currentLiabilities.total
      },
      equity
    };
  }

  /**
   * ========================================
   * GASTOS POR CATEGORÍA
   * ========================================
   */
  async getExpensesByCategory(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExpensesByCategoryDto> {
    const stats = await this.expenseService.getExpenseStats(
      tenantId,
      startDate,
      endDate
    );

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        description: this.getPeriodDescription(startDate, endDate)
      },
      categories: stats.byType.map(item => ({
        category: this.getCategoryName(item.type),
        icon: item.icon,
        amount: item.total,
        percentage: Number(item.percentage.toFixed(1)),
        count: item.count
      })),
      total: stats.total
    };
  }

  /**
   * ========================================
   * MÉTODOS AUXILIARES
   * ========================================
   */

  /**
   * Calcula el saldo de una cuenta contable
   * Débitos aumentan cuentas de naturaleza DEBIT
   * Créditos aumentan cuentas de naturaleza CREDIT
   */
  private async getAccountBalance(accountId: string): Promise<number> {
    const account = await this.chartOfAccountsRepository.findOne({
      where: { id: accountId }
    });

    if (!account) return 0;

    const lines = await this.journalEntryLineRepository.find({
      where: { accountId },
      relations: ['journalEntry']
    });

    let balance = 0;

    lines.forEach(line => {
      const amount = Number(line.amount);

      if (line.movementType === MovementType.DEBIT) {
        // Débitos aumentan activos, gastos, costos
        if (account.nature === 'DEBIT') {
          balance += amount;
        } else {
          balance -= amount;
        }
      } else {
        // Créditos aumentan pasivos, patrimonio, ingresos
        if (account.nature === 'CREDIT') {
          balance += amount;
        } else {
          balance -= amount;
        }
      }
    });

    return Math.abs(balance);
  }

  private async getAccountBalanceByCode(
    tenantId: string,
    code: string
  ): Promise<number> {
    const account = await this.chartOfAccountsRepository.findOne({
      where: { tenantId, code }
    });

    if (!account) return 0;

    return this.getAccountBalance(account.id);
  }

  private async getCostOfSales(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Obtener saldo de cuenta 6135 (Costo de Ventas)
    const account = await this.chartOfAccountsRepository.findOne({
      where: { tenantId, code: '6135' }
    });

    if (!account) return 0;

    const lines = await this.journalEntryLineRepository.find({
      where: {
        accountId: account.id
      },
      relations: ['journalEntry']
    });

    // Filtrar por período
    const filteredLines = lines.filter(line => {
      const entryDate = new Date(line.journalEntry.entryDate);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Sumar débitos (costos son débito)
    return filteredLines
      .filter(l => l.movementType === MovementType.DEBIT)
      .reduce((sum, l) => sum + Number(l.amount), 0);
  }

  private getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || '';
  }

  private getPeriodDescription(startDate: Date, endDate: Date): string {
    const startMonth = this.getMonthName(startDate.getMonth() + 1);
    const endMonth = this.getMonthName(endDate.getMonth() + 1);
    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    } else {
      return `${startMonth} - ${endMonth} ${year}`;
    }
  }

  private getCategoryName(type: string): string {
    const map: Record<string, string> = {
      'INVENTORY_PURCHASE': 'Compra de Inventario',
      'RENT': 'Arriendo',
      'UTILITIES': 'Servicios Públicos',
      'INTERNET_PHONE': 'Internet y Teléfono',
      'PAYROLL': 'Nómina',
      'PROFESSIONAL_SERVICES': 'Servicios Profesionales',
      'INSURANCE': 'Seguros',
      'MAINTENANCE': 'Mantenimiento',
      'TRAVEL': 'Viáticos',
      'ADVERTISING': 'Publicidad',
      'OFFICE_SUPPLIES': 'Papelería',
      'TAXES_FEES': 'Impuestos y Tasas',
      'OTHER': 'Otros Gastos'
    };
    return map[type] || 'Otros';
  }
}
