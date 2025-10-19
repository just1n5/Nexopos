import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense, ExpenseStatus } from '../entities/expense.entity';
import { JournalEntryService } from './journal-entry.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { ExpenseResponseDto } from '../dto/expense-response.dto';

/**
 * Servicio para gestión de Gastos y Compras
 *
 * Responsabilidades:
 * - CRUD de gastos
 * - Generar asientos contables automáticos al crear gastos
 * - Procesar OCR de facturas
 * - Generar números consecutivos
 * - Estadísticas y reportes de gastos
 */
@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    private journalEntryService: JournalEntryService
  ) {}

  /**
   * ========================================
   * CREAR GASTO
   * ========================================
   *
   * 1. Valida los datos
   * 2. Genera número consecutivo
   * 3. Crea el gasto
   * 4. Genera asiento contable automático
   * 5. Actualiza el gasto con el ID del asiento
   */
  async create(
    createExpenseDto: CreateExpenseDto,
    tenantId: string,
    userId: string
  ): Promise<ExpenseResponseDto> {
    // Validar que el total sea correcto
    this.validateTotals(createExpenseDto);

    // Generar número consecutivo
    const expenseNumber = await this.generateExpenseNumber(tenantId);

    // Determinar status inicial
    const status = createExpenseDto.paymentMethod === 'CREDIT'
      ? ExpenseStatus.PENDING
      : ExpenseStatus.PAID;

    // Crear el gasto
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      expenseNumber,
      tenantId,
      createdBy: userId,
      status,
      expenseDate: new Date(createExpenseDto.expenseDate),
      paymentDate: createExpenseDto.paymentDate ? new Date(createExpenseDto.paymentDate) : null
    });

    const savedExpense = await this.expenseRepository.save(expense);

    // Si está pagado, generar asiento contable automático
    if (status === ExpenseStatus.PAID) {
      try {
        const journalEntry = await this.journalEntryService.createExpenseEntry(
          savedExpense,
          tenantId,
          userId
        );

        // Actualizar gasto con referencia al asiento
        savedExpense.journalEntryId = journalEntry.id;
        await this.expenseRepository.save(savedExpense);
      } catch (error) {
        console.error('Error al crear asiento contable para gasto:', error);
        // El gasto se creó, pero el asiento falló
        // Podríamos lanzar un warning pero no fallar toda la operación
      }
    }

    return this.toResponseDto(savedExpense);
  }

  /**
   * ========================================
   * OBTENER TODOS LOS GASTOS
   * ========================================
   */
  async findAll(
    tenantId: string,
    filters?: {
      status?: ExpenseStatus;
      type?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ExpenseResponseDto[]> {
    const where: any = { tenantId };

    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.type) {
        where.type = filters.type;
      }
      if (filters.startDate && filters.endDate) {
        where.expenseDate = Between(filters.startDate, filters.endDate);
      }
    }

    const expenses = await this.expenseRepository.find({
      where,
      order: { expenseDate: 'DESC', createdAt: 'DESC' }
    });

    return expenses.map(expense => this.toResponseDto(expense));
  }

  /**
   * ========================================
   * OBTENER GASTO POR ID
   * ========================================
   */
  async findOne(id: string, tenantId: string): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findOne({
      where: { id, tenantId }
    });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    return this.toResponseDto(expense);
  }

  /**
   * ========================================
   * ACTUALIZAR GASTO
   * ========================================
   */
  async update(
    id: string,
    updateData: Partial<CreateExpenseDto>,
    tenantId: string
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findOne({
      where: { id, tenantId }
    });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    // No permitir editar gastos que ya tienen asiento contable
    if (expense.journalEntryId) {
      throw new BadRequestException(
        'No se puede editar un gasto que ya tiene asiento contable. ' +
        'Debe anular el gasto y crear uno nuevo.'
      );
    }

    Object.assign(expense, updateData);

    if (updateData.subtotal !== undefined || updateData.taxAmount !== undefined) {
      this.validateTotals(expense as any);
    }

    const updated = await this.expenseRepository.save(expense);
    return this.toResponseDto(updated);
  }

  /**
   * ========================================
   * MARCAR GASTO COMO PAGADO
   * ========================================
   *
   * Al marcar como pagado, genera el asiento contable
   */
  async markAsPaid(
    id: string,
    tenantId: string,
    userId: string,
    paymentDate?: Date
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findOne({
      where: { id, tenantId }
    });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    if (expense.status === ExpenseStatus.PAID) {
      throw new BadRequestException('El gasto ya está marcado como pagado');
    }

    // Actualizar estado
    expense.status = ExpenseStatus.PAID;
    expense.paymentDate = paymentDate || new Date();

    const updated = await this.expenseRepository.save(expense);

    // Generar asiento contable
    try {
      const journalEntry = await this.journalEntryService.createExpenseEntry(
        updated,
        tenantId,
        userId
      );

      updated.journalEntryId = journalEntry.id;
      await this.expenseRepository.save(updated);
    } catch (error) {
      console.error('Error al crear asiento contable:', error);
    }

    return this.toResponseDto(updated);
  }

  /**
   * ========================================
   * ELIMINAR/CANCELAR GASTO
   * ========================================
   */
  async cancel(id: string, tenantId: string): Promise<void> {
    const expense = await this.expenseRepository.findOne({
      where: { id, tenantId }
    });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    // No permitir cancelar gastos que ya tienen asiento contable
    if (expense.journalEntryId) {
      throw new BadRequestException(
        'No se puede cancelar un gasto que ya tiene asiento contable. ' +
        'Debe crear un asiento de reversa.'
      );
    }

    expense.status = ExpenseStatus.CANCELLED;
    await this.expenseRepository.save(expense);
  }

  /**
   * ========================================
   * PROCESAR OCR DE FACTURA
   * ========================================
   *
   * Este método se llamaría desde un endpoint de upload
   * Por ahora es un placeholder para la integración futura
   */
  async processInvoiceOCR(
    imageFile: any,
    tenantId: string
  ): Promise<{
    supplierName?: string;
    supplierNit?: string;
    invoiceNumber?: string;
    date?: string;
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    confidence?: number;
  }> {
    // TODO: Integrar con servicio OCR (Google Cloud Vision, Tesseract, etc.)
    // Por ahora retornamos datos de ejemplo

    return {
      supplierName: 'Proveedor Ejemplo',
      supplierNit: '900123456-7',
      invoiceNumber: 'FV-12345',
      date: new Date().toISOString().split('T')[0],
      subtotal: 100000,
      taxAmount: 19000,
      total: 119000,
      confidence: 0.85
    };
  }

  /**
   * ========================================
   * ESTADÍSTICAS DE GASTOS
   * ========================================
   */
  async getExpenseStats(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    count: number;
    byType: Array<{
      type: string;
      icon: string;
      total: number;
      count: number;
      percentage: number;
    }>;
    byMonth: Array<{
      month: string;
      total: number;
      count: number;
    }>;
  }> {
    const expenses = await this.expenseRepository.find({
      where: {
        tenantId,
        status: ExpenseStatus.PAID,
        expenseDate: Between(startDate, endDate)
      }
    });

    // Total general
    const total = expenses.reduce((sum, e) => sum + Number(e.total), 0);
    const count = expenses.length;

    // Agrupar por tipo
    const byTypeMap = new Map<string, { total: number; count: number; icon: string }>();

    expenses.forEach(expense => {
      const existing = byTypeMap.get(expense.type) || { total: 0, count: 0, icon: expense.getIcon() };
      existing.total += Number(expense.total);
      existing.count += 1;
      byTypeMap.set(expense.type, existing);
    });

    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      icon: data.icon,
      total: data.total,
      count: data.count,
      percentage: total > 0 ? (data.total / total) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    // Agrupar por mes (simplificado)
    const byMonthMap = new Map<string, { total: number; count: number }>();

    expenses.forEach(expense => {
      const monthKey = expense.expenseDate.toISOString().substring(0, 7); // YYYY-MM
      const existing = byMonthMap.get(monthKey) || { total: 0, count: 0 };
      existing.total += Number(expense.total);
      existing.count += 1;
      byMonthMap.set(monthKey, existing);
    });

    const byMonth = Array.from(byMonthMap.entries()).map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));

    return {
      total,
      count,
      byType,
      byMonth
    };
  }

  /**
   * ========================================
   * MÉTODOS PRIVADOS DE UTILIDAD
   * ========================================
   */

  private async generateExpenseNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.expenseRepository.count({
      where: { tenantId }
    });
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `EXP-${year}-${nextNumber}`;
  }

  private validateTotals(dto: CreateExpenseDto | Expense): void {
    const subtotal = Number(dto.subtotal);
    const taxAmount = Number(dto.taxAmount || 0);
    const total = Number(dto.total);

    const expectedTotal = subtotal + taxAmount;
    const difference = Math.abs(expectedTotal - total);

    // Tolerancia de 1 peso por redondeos
    if (difference > 1) {
      throw new BadRequestException(
        `El total no coincide. Esperado: ${expectedTotal}, Recibido: ${total}`
      );
    }
  }

  private toResponseDto(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      expenseNumber: expense.expenseNumber,
      type: expense.type,
      status: expense.status,
      expenseDate: expense.expenseDate,
      supplierName: expense.supplierName,
      supplierNit: expense.supplierNit,
      invoiceNumber: expense.invoiceNumber,
      subtotal: Number(expense.subtotal),
      taxAmount: Number(expense.taxAmount),
      total: Number(expense.total),
      paymentMethod: expense.paymentMethod,
      paymentDate: expense.paymentDate,
      description: expense.description,
      invoiceImageUrl: expense.invoiceImageUrl,
      isOcrExtracted: expense.isOcrExtracted,
      journalEntryId: expense.journalEntryId,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      icon: expense.getIcon(),
      pucCode: expense.getPUCCode()
    };
  }
}
