import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from '../../sales/entities/sale.entity';
import { Expense, ExpenseStatus } from '../entities/expense.entity';
import { TaxWithholding, WithholdingDirection } from '../entities/tax-withholding.entity';

/**
 * Servicio para cálculos fiscales y tributarios
 *
 * Responsabilidades:
 * - Calcular IVA generado (ventas)
 * - Calcular IVA descontable (compras/gastos)
 * - Calcular saldo de IVA a pagar/favor
 * - Calcular retenciones a favor
 * - Generar datos para reportes fiscales
 */
@Injectable()
export class TaxCalculationService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(TaxWithholding)
    private taxWithholdingRepository: Repository<TaxWithholding>
  ) {}

  /**
   * ========================================
   * CÁLCULO DE IVA GENERADO (VENTAS)
   * ========================================
   *
   * Suma el IVA de todas las ventas completadas en un período
   * Solo se cuenta el IVA de ventas con status COMPLETED
   */
  async calculateIVAGenerado(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSales: number;
    general19: number;
    reduced5: number;
    exempt: number;
    totalIVA: number;
  }> {
    const sales = await this.saleRepository.find({
      where: {
        // @ts-ignore - tenantId existe en la entidad a través del cashRegister
        status: SaleStatus.COMPLETED,
        createdAt: Between(startDate, endDate)
      }
    });

    // Calcular totales
    let totalSales = 0;
    let totalIVA = 0;
    let general19 = 0;
    let reduced5 = 0;
    let exempt = 0;

    for (const sale of sales) {
      totalSales += Number(sale.total);
      totalIVA += Number(sale.taxAmount || 0);

      // Calcular por tarifa (requiere análisis de items - simplificado)
      const taxRate = Number(sale.taxAmount) / Number(sale.subtotal) * 100;

      if (taxRate >= 18 && taxRate <= 20) {
        general19 += Number(sale.taxAmount);
      } else if (taxRate >= 4 && taxRate <= 6) {
        reduced5 += Number(sale.taxAmount);
      } else if (taxRate < 1) {
        exempt += Number(sale.subtotal);
      }
    }

    return {
      totalSales,
      general19,
      reduced5,
      exempt,
      totalIVA
    };
  }

  /**
   * ========================================
   * CÁLCULO DE IVA DESCONTABLE (COMPRAS/GASTOS)
   * ========================================
   *
   * Suma el IVA de todas las compras y gastos pagados en un período
   * Solo se cuenta el IVA de gastos con status PAID
   */
  async calculateIVADescontable(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalPurchases: number;
    purchasesIVA: number;
    expensesIVA: number;
    totalIVA: number;
  }> {
    const expenses = await this.expenseRepository.find({
      where: {
        tenantId,
        status: ExpenseStatus.PAID,
        expenseDate: Between(startDate, endDate)
      }
    });

    let totalPurchases = 0;
    let purchasesIVA = 0;
    let expensesIVA = 0;

    for (const expense of expenses) {
      totalPurchases += Number(expense.total);
      const ivaAmount = Number(expense.taxAmount || 0);

      // Separar compras de inventario vs gastos operativos
      if (expense.type === 'INVENTORY_PURCHASE') {
        purchasesIVA += ivaAmount;
      } else {
        expensesIVA += ivaAmount;
      }
    }

    const totalIVA = purchasesIVA + expensesIVA;

    return {
      totalPurchases,
      purchasesIVA,
      expensesIVA,
      totalIVA
    };
  }

  /**
   * ========================================
   * CÁLCULO DE SALDO DE IVA
   * ========================================
   *
   * Calcula si el negocio debe pagar IVA o tiene saldo a favor
   * Fórmula: IVA Generado - IVA Descontable
   *
   * Positivo = A pagar a la DIAN
   * Negativo = A favor (la DIAN debe devolver)
   */
  async calculateIVABalance(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    ivaGenerado: number;
    ivaDescontable: number;
    saldo: number;
    tipo: 'a_pagar' | 'a_favor';
  }> {
    const generated = await this.calculateIVAGenerado(tenantId, startDate, endDate);
    const deductible = await this.calculateIVADescontable(tenantId, startDate, endDate);

    const ivaGenerado = generated.totalIVA;
    const ivaDescontable = deductible.totalIVA;
    const saldo = ivaGenerado - ivaDescontable;

    return {
      ivaGenerado,
      ivaDescontable,
      saldo: Math.abs(saldo),
      tipo: saldo >= 0 ? 'a_pagar' : 'a_favor'
    };
  }

  /**
   * ========================================
   * CÁLCULO DE RETENCIONES A FAVOR
   * ========================================
   *
   * Suma todas las retenciones que le practicaron al negocio
   * Estas son saldos A FAVOR que se pueden descontar del impuesto de renta
   */
  async calculateWithholdingsInFavor(
    tenantId: string,
    year: number
  ): Promise<{
    total: number;
    byType: {
      reteFuente: number;
      reteIVA: number;
      reteICA: number;
    };
    count: number;
  }> {
    const startDate = new Date(year, 0, 1); // 1 de enero
    const endDate = new Date(year, 11, 31, 23, 59, 59); // 31 de diciembre

    const withholdings = await this.taxWithholdingRepository.find({
      where: {
        tenantId,
        direction: WithholdingDirection.RECEIVED, // Solo las recibidas (a favor)
        withholdingDate: Between(startDate, endDate)
      }
    });

    let total = 0;
    let reteFuente = 0;
    let reteIVA = 0;
    let reteICA = 0;

    for (const withholding of withholdings) {
      const amount = Number(withholding.withheldAmount);
      total += amount;

      switch (withholding.type) {
        case 'RETEFTE':
          reteFuente += amount;
          break;
        case 'RETEIVA':
          reteIVA += amount;
          break;
        case 'RETEICA':
          reteICA += amount;
          break;
      }
    }

    return {
      total,
      byType: {
        reteFuente,
        reteIVA,
        reteICA
      },
      count: withholdings.length
    };
  }

  /**
   * ========================================
   * CÁLCULO DE RETENCIONES PRACTICADAS
   * ========================================
   *
   * Suma todas las retenciones que el negocio practicó a sus proveedores
   * Estas son OBLIGACIONES que debe declarar y pagar a la DIAN
   */
  async calculateWithholdingsPracticed(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    byType: {
      reteFuente: number;
      reteIVA: number;
      reteICA: number;
    };
    count: number;
  }> {
    const withholdings = await this.taxWithholdingRepository.find({
      where: {
        tenantId,
        direction: WithholdingDirection.PRACTICED, // Solo las practicadas
        withholdingDate: Between(startDate, endDate)
      }
    });

    let total = 0;
    let reteFuente = 0;
    let reteIVA = 0;
    let reteICA = 0;

    for (const withholding of withholdings) {
      const amount = Number(withholding.withheldAmount);
      total += amount;

      switch (withholding.type) {
        case 'RETEFTE':
          reteFuente += amount;
          break;
        case 'RETEIVA':
          reteIVA += amount;
          break;
        case 'RETEICA':
          reteICA += amount;
          break;
      }
    }

    return {
      total,
      byType: {
        reteFuente,
        reteIVA,
        reteICA
      },
      count: withholdings.length
    };
  }

  /**
   * ========================================
   * REPORTE COMPLETO DE IVA PARA DECLARACIÓN
   * ========================================
   *
   * Genera todos los datos necesarios para llenar el Formulario 300 de la DIAN
   */
  async getIVAReportData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const [generated, deductible, balance] = await Promise.all([
      this.calculateIVAGenerado(tenantId, startDate, endDate),
      this.calculateIVADescontable(tenantId, startDate, endDate),
      this.calculateIVABalance(tenantId, startDate, endDate)
    ]);

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        description: this.getPeriodDescription(startDate, endDate)
      },
      ivaGenerado: {
        totalSales: generated.totalSales,
        general19: generated.general19,
        reduced5: generated.reduced5,
        exempt: generated.exempt,
        totalIVA: generated.totalIVA
      },
      ivaDescontable: {
        totalPurchases: deductible.totalPurchases,
        purchasesIVA: deductible.purchasesIVA,
        expensesIVA: deductible.expensesIVA,
        totalIVA: deductible.totalIVA
      },
      balance: {
        type: balance.tipo,
        value: balance.saldo
      }
    };
  }

  /**
   * ========================================
   * CALCULAR PROVISIÓN DE IMPUESTOS
   * ========================================
   *
   * Calcula cuánto dinero debe apartar el negocio para impuestos
   * Este es el "Widget 5" del dashboard - LA PREGUNTA DEL MILLÓN
   */
  async calculateTaxProvision(
    tenantId: string,
    month: number,
    year: number
  ): Promise<{
    total: number;
    breakdown: {
      iva: number;
      withholdings: number;
    };
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [ivaBalance, withholdings] = await Promise.all([
      this.calculateIVABalance(tenantId, startDate, endDate),
      this.calculateWithholdingsPracticed(tenantId, startDate, endDate)
    ]);

    const iva = ivaBalance.tipo === 'a_pagar' ? ivaBalance.saldo : 0;
    const withholdingsAmount = withholdings.total;

    return {
      total: iva + withholdingsAmount,
      breakdown: {
        iva,
        withholdings: withholdingsAmount
      }
    };
  }

  /**
   * ========================================
   * UTILIDADES
   * ========================================
   */

  private getPeriodDescription(startDate: Date, endDate: Date): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const startMonth = months[startDate.getMonth()];
    const endMonth = months[endDate.getMonth()];
    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    } else {
      return `${startMonth} - ${endMonth} ${year}`;
    }
  }

  /**
   * Calcula el período bimestral actual
   * Colombia usa períodos bimestrales para IVA
   */
  getCurrentBimonthlyPeriod(): { startDate: Date; endDate: Date; description: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // Determinar bimestre (0-1, 2-3, 4-5, 6-7, 8-9, 10-11)
    const bimonthStart = Math.floor(month / 2) * 2;

    const startDate = new Date(year, bimonthStart, 1);
    const endDate = new Date(year, bimonthStart + 2, 0, 23, 59, 59);

    return {
      startDate,
      endDate,
      description: this.getPeriodDescription(startDate, endDate)
    };
  }
}
