import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Services
import { AccountingReportsService } from './services/accounting-reports.service';
import { ExpenseService } from './services/expense.service';
import { FiscalConfigService } from './services/fiscal-config.service';
import { JournalEntryService } from './services/journal-entry.service';
import { TaxCalculationService } from './services/tax-calculation.service';
import { ExcelExportService } from './services/excel-export.service';

// DTOs
import { CreateExpenseDto } from './dto/create-expense.dto';
import { FiscalConfigDto } from './dto/fiscal-config.dto';
import { ExpenseStatus } from './entities/expense.entity';

/**
 * Controlador REST para el módulo de Contabilidad
 *
 * Endpoints organizados por dominio:
 * 1. Dashboard y Reportes
 * 2. Gastos y Compras
 * 3. Configuración Fiscal
 * 4. Asientos Contables
 * 5. Cálculos Fiscales
 */
@ApiTags('accounting')
@Controller('accounting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountingController {
  constructor(
    private readonly reportsService: AccountingReportsService,
    private readonly expenseService: ExpenseService,
    private readonly fiscalConfigService: FiscalConfigService,
    private readonly journalEntryService: JournalEntryService,
    private readonly taxCalculationService: TaxCalculationService,
    private readonly excelExportService: ExcelExportService
  ) {}

  /**
   * =====================================================
   * 1. DASHBOARD Y REPORTES
   * =====================================================
   */

  /**
   * GET /accounting/dashboard
   * Obtiene los 5 widgets del dashboard principal
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener dashboard de contabilidad con 5 widgets principales' })
  @ApiResponse({ status: 200, description: 'Dashboard obtenido exitosamente' })
  async getDashboard(
    @Request() req,
    @Query('month', ParseIntPipe) month?: number,
    @Query('year', ParseIntPipe) year?: number
  ) {
    const tenantId = req.user.tenantId;
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    return this.reportsService.getDashboardData(tenantId, targetMonth, targetYear);
  }

  /**
   * GET /accounting/reports/iva
   * Reporte de IVA para declaración bimestral
   */
  @Get('reports/iva')
  @ApiOperation({ summary: 'Obtener reporte de IVA para declaración DIAN' })
  @ApiResponse({ status: 200, description: 'Reporte de IVA generado exitosamente' })
  async getIVAReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Se requieren las fechas de inicio y fin');
    }

    const tenantId = req.user.tenantId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.reportsService.getIVAReport(tenantId, start, end);
  }

  /**
   * GET /accounting/reports/profit-loss
   * Estado de Resultados (P&L)
   */
  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Obtener Estado de Resultados (P&L)' })
  @ApiResponse({ status: 200, description: 'Estado de resultados generado exitosamente' })
  async getProfitAndLoss(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Se requieren las fechas de inicio y fin');
    }

    const tenantId = req.user.tenantId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.reportsService.getProfitAndLoss(tenantId, start, end);
  }

  /**
   * GET /accounting/reports/balance-sheet
   * Balance General
   */
  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Obtener Balance General' })
  @ApiResponse({ status: 200, description: 'Balance general generado exitosamente' })
  async getBalanceSheet(
    @Request() req,
    @Query('date') date?: string
  ) {
    const tenantId = req.user.tenantId;
    const targetDate = date ? new Date(date) : new Date();

    return this.reportsService.getBalanceSheet(tenantId, targetDate);
  }

  /**
   * GET /accounting/reports/expenses-by-category
   * Gastos agrupados por categoría
   */
  @Get('reports/expenses-by-category')
  @ApiOperation({ summary: 'Obtener gastos agrupados por categoría' })
  @ApiResponse({ status: 200, description: 'Reporte de gastos generado exitosamente' })
  async getExpensesByCategory(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Se requieren las fechas de inicio y fin');
    }

    const tenantId = req.user.tenantId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.reportsService.getExpensesByCategory(tenantId, start, end);
  }

  /**
   * GET /accounting/reports/iva/export
   * Exportar reporte de IVA a Excel
   */
  @Get('reports/iva/export')
  @ApiOperation({ summary: 'Exportar reporte de IVA a Excel' })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente',
    headers: {
      'Content-Type': { description: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      'Content-Disposition': { description: 'attachment; filename="reporte-iva.xlsx"' }
    }
  })
  async exportIVAReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Se requieren las fechas de inicio y fin');
    }

    const tenantId = req.user.tenantId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Obtener el reporte
    const report = await this.reportsService.getIVAReport(tenantId, start, end);

    // Generar Excel
    const buffer = await this.excelExportService.exportIVAReport(report);

    // Configurar headers para descarga
    req.res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    req.res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-iva-${startDate}-${endDate}.xlsx"`
    );

    return req.res.send(buffer);
  }

  /**
   * GET /accounting/reports/profit-loss/export
   * Exportar Estado de Resultados (P&L) a Excel
   */
  @Get('reports/profit-loss/export')
  @ApiOperation({ summary: 'Exportar Estado de Resultados (P&L) a Excel' })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente',
    headers: {
      'Content-Type': { description: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      'Content-Disposition': { description: 'attachment; filename="estado-resultados.xlsx"' }
    }
  })
  async exportProfitAndLoss(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Se requieren las fechas de inicio y fin');
    }

    const tenantId = req.user.tenantId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Obtener el reporte
    const report = await this.reportsService.getProfitAndLoss(tenantId, start, end);

    // Generar Excel
    const buffer = await this.excelExportService.exportProfitAndLossReport(report);

    // Configurar headers para descarga
    req.res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    req.res.setHeader(
      'Content-Disposition',
      `attachment; filename="estado-resultados-${startDate}-${endDate}.xlsx"`
    );

    return req.res.send(buffer);
  }

  /**
   * GET /accounting/reports/balance-sheet/export
   * Exportar Balance General a Excel
   */
  @Get('reports/balance-sheet/export')
  @ApiOperation({ summary: 'Exportar Balance General a Excel' })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente',
    headers: {
      'Content-Type': { description: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      'Content-Disposition': { description: 'attachment; filename="balance-general.xlsx"' }
    }
  })
  async exportBalanceSheet(
    @Request() req,
    @Query('date') date?: string
  ) {
    const tenantId = req.user.tenantId;
    const balanceDate = date ? new Date(date) : new Date();

    // Obtener el reporte
    const report = await this.reportsService.getBalanceSheet(tenantId, balanceDate);

    // Generar Excel
    const buffer = await this.excelExportService.exportBalanceSheet(report);

    // Configurar headers para descarga
    req.res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    req.res.setHeader(
      'Content-Disposition',
      `attachment; filename="balance-general-${report.date}.xlsx"`
    );

    return req.res.send(buffer);
  }

  /**
   * =====================================================
   * 2. GASTOS Y COMPRAS
   * =====================================================
   */

  /**
   * POST /accounting/expenses
   * Crear nuevo gasto
   */
  @Post('expenses')
  @ApiOperation({ summary: 'Crear nuevo gasto o compra' })
  @ApiResponse({ status: 201, description: 'Gasto creado exitosamente' })
  async createExpense(
    @Request() req,
    @Body() createExpenseDto: CreateExpenseDto
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    return this.expenseService.create(createExpenseDto, tenantId, userId);
  }

  /**
   * GET /accounting/expenses
   * Listar gastos con filtros opcionales
   */
  @Get('expenses')
  @ApiOperation({ summary: 'Listar todos los gastos con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Lista de gastos obtenida exitosamente' })
  async getExpenses(
    @Request() req,
    @Query('status') status?: ExpenseStatus,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const tenantId = req.user.tenantId;

    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (startDate && endDate) {
      filters.startDate = new Date(startDate);
      filters.endDate = new Date(endDate);
    }

    return this.expenseService.findAll(tenantId, filters);
  }

  /**
   * GET /accounting/expenses/:id
   * Obtener detalle de un gasto
   */
  @Get('expenses/:id')
  @ApiOperation({ summary: 'Obtener detalle de un gasto específico' })
  @ApiResponse({ status: 200, description: 'Detalle del gasto obtenido exitosamente' })
  async getExpense(
    @Request() req,
    @Param('id') id: string
  ) {
    const tenantId = req.user.tenantId;
    return this.expenseService.findOne(id, tenantId);
  }

  /**
   * PUT /accounting/expenses/:id
   * Actualizar un gasto
   */
  @Put('expenses/:id')
  @ApiOperation({ summary: 'Actualizar un gasto existente' })
  @ApiResponse({ status: 200, description: 'Gasto actualizado exitosamente' })
  async updateExpense(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateExpenseDto>
  ) {
    const tenantId = req.user.tenantId;
    return this.expenseService.update(id, updateData, tenantId);
  }

  /**
   * POST /accounting/expenses/:id/mark-paid
   * Marcar un gasto como pagado
   */
  @Post('expenses/:id/mark-paid')
  @ApiOperation({ summary: 'Marcar un gasto pendiente como pagado' })
  @ApiResponse({ status: 200, description: 'Gasto marcado como pagado exitosamente' })
  async markExpenseAsPaid(
    @Request() req,
    @Param('id') id: string,
    @Body('paymentDate') paymentDate?: string
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const date = paymentDate ? new Date(paymentDate) : undefined;

    return this.expenseService.markAsPaid(id, tenantId, userId, date);
  }

  /**
   * DELETE /accounting/expenses/:id
   * Cancelar un gasto
   */
  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Cancelar un gasto' })
  @ApiResponse({ status: 200, description: 'Gasto cancelado exitosamente' })
  async cancelExpense(
    @Request() req,
    @Param('id') id: string
  ) {
    const tenantId = req.user.tenantId;
    await this.expenseService.cancel(id, tenantId);
    return { message: 'Gasto cancelado exitosamente' };
  }

  /**
   * GET /accounting/expenses/stats
   * Estadísticas de gastos
   */
  @Get('expenses-stats')
  @ApiOperation({ summary: 'Obtener estadísticas de gastos' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getExpenseStats(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Se requieren las fechas de inicio y fin');
    }

    const tenantId = req.user.tenantId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.expenseService.getExpenseStats(tenantId, start, end);
  }

  /**
   * =====================================================
   * 3. CONFIGURACIÓN FISCAL
   * =====================================================
   */

  /**
   * GET /accounting/fiscal-config
   * Obtener configuración fiscal del negocio
   */
  @Get('fiscal-config')
  @ApiOperation({ summary: 'Obtener configuración fiscal del negocio' })
  @ApiResponse({ status: 200, description: 'Configuración fiscal obtenida exitosamente' })
  async getFiscalConfig(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.fiscalConfigService.findByTenant(tenantId);
  }

  /**
   * PUT /accounting/fiscal-config
   * Crear o actualizar configuración fiscal
   */
  @Put('fiscal-config')
  @ApiOperation({ summary: 'Crear o actualizar configuración fiscal' })
  @ApiResponse({ status: 200, description: 'Configuración fiscal guardada exitosamente' })
  async upsertFiscalConfig(
    @Request() req,
    @Body() configData: FiscalConfigDto
  ) {
    const tenantId = req.user.tenantId;
    return this.fiscalConfigService.upsert(tenantId, configData);
  }

  /**
   * GET /accounting/fiscal-config/summary
   * Resumen de configuración fiscal
   */
  @Get('fiscal-config/summary')
  @ApiOperation({ summary: 'Obtener resumen de configuración fiscal' })
  @ApiResponse({ status: 200, description: 'Resumen obtenido exitosamente' })
  async getFiscalSummary(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.fiscalConfigService.getFiscalSummary(tenantId);
  }

  /**
   * GET /accounting/fiscal-config/validate
   * Validar si la configuración fiscal está completa
   */
  @Get('fiscal-config/validate')
  @ApiOperation({ summary: 'Validar completitud de configuración fiscal' })
  @ApiResponse({ status: 200, description: 'Validación realizada exitosamente' })
  async validateFiscalConfig(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.fiscalConfigService.validateCompleteConfig(tenantId);
  }

  /**
   * POST /accounting/fiscal-config/next-invoice-number
   * Obtener siguiente número de factura
   */
  @Post('fiscal-config/next-invoice-number')
  @ApiOperation({ summary: 'Obtener y reservar siguiente número de factura DIAN' })
  @ApiResponse({ status: 200, description: 'Número de factura obtenido exitosamente' })
  async getNextInvoiceNumber(@Request() req) {
    const tenantId = req.user.tenantId;
    const invoiceNumber = await this.fiscalConfigService.getNextInvoiceNumber(tenantId);
    return { invoiceNumber };
  }

  /**
   * =====================================================
   * 4. ASIENTOS CONTABLES
   * =====================================================
   */

  /**
   * GET /accounting/journal-entries
   * Listar asientos contables
   */
  @Get('journal-entries')
  @ApiOperation({ summary: 'Listar asientos contables con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Lista de asientos obtenida exitosamente' })
  async getJournalEntries(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('entryType') entryType?: string
  ) {
    const tenantId = req.user.tenantId;

    const filters: any = {};
    if (startDate && endDate) {
      filters.startDate = new Date(startDate);
      filters.endDate = new Date(endDate);
    }
    if (entryType) {
      filters.entryType = entryType;
    }

    return this.journalEntryService.findAll(tenantId, filters);
  }

  /**
   * GET /accounting/journal-entries/:id
   * Obtener detalle de un asiento contable
   */
  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Obtener detalle de un asiento contable' })
  @ApiResponse({ status: 200, description: 'Detalle del asiento obtenido exitosamente' })
  async getJournalEntry(
    @Request() req,
    @Param('id') id: string
  ) {
    const tenantId = req.user.tenantId;
    return this.journalEntryService.findOne(id, tenantId);
  }

  /**
   * =====================================================
   * 5. CÁLCULOS FISCALES
   * =====================================================
   */

  /**
   * GET /accounting/tax/iva-balance
   * Calcular saldo de IVA (a pagar o a favor)
   */
  @Get('tax/iva-balance')
  @ApiOperation({ summary: 'Calcular saldo de IVA del período' })
  @ApiResponse({ status: 200, description: 'Saldo de IVA calculado exitosamente' })
  async getIVABalance(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Se requieren las fechas de inicio y fin');
    }

    const tenantId = req.user.tenantId;
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.taxCalculationService.calculateIVABalance(tenantId, start, end);
  }

  /**
   * GET /accounting/tax/withholdings-in-favor
   * Retenciones a favor del negocio
   */
  @Get('tax/withholdings-in-favor')
  @ApiOperation({ summary: 'Calcular retenciones a favor del negocio' })
  @ApiResponse({ status: 200, description: 'Retenciones calculadas exitosamente' })
  async getWithholdingsInFavor(
    @Request() req,
    @Query('year', ParseIntPipe) year: number
  ) {
    const tenantId = req.user.tenantId;
    return this.taxCalculationService.calculateWithholdingsInFavor(tenantId, year);
  }

  /**
   * GET /accounting/tax/provision
   * Provisión de impuestos del mes
   */
  @Get('tax/provision')
  @ApiOperation({ summary: 'Calcular provisión de impuestos del período' })
  @ApiResponse({ status: 200, description: 'Provisión calculada exitosamente' })
  async getTaxProvision(
    @Request() req,
    @Query('month', ParseIntPipe) month?: number,
    @Query('year', ParseIntPipe) year?: number
  ) {
    const tenantId = req.user.tenantId;
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    return this.taxCalculationService.calculateTaxProvision(tenantId, targetMonth, targetYear);
  }
}
