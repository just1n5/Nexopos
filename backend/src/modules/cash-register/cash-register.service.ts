import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CashRegister, CashRegisterStatus } from './entities/cash-register.entity';
import { CashMovement, MovementType, MovementCategory } from './entities/cash-movement.entity';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateMovementDto,
  CreateExpenseDto,
  CashAdjustmentDto,
  CashRegisterSummaryDto
} from './dto/cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(CashMovement)
    private cashMovementRepository: Repository<CashMovement>,
    private dataSource: DataSource,
  ) {}

  async openCashRegister(dto: OpenCashRegisterDto, userId: string): Promise<CashRegister> {
    // Check if there's already an open cash register for this user
    const existingOpen = await this.cashRegisterRepository.findOne({
      where: {
        userId,
        status: CashRegisterStatus.OPEN
      }
    });

    if (existingOpen) {
      throw new ConflictException('You already have an open cash register session');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate session number
      const sessionNumber = await this.generateSessionNumber();

      // Create cash register
      const cashRegister = queryRunner.manager.create(CashRegister, {
        sessionNumber,
        userId,
        terminalId: dto.terminalId,
        status: CashRegisterStatus.OPEN,
        openingBalance: dto.openingBalance,
        openedAt: new Date(),
        openedBy: userId,
        openingNotes: dto.openingNotes
      });

      const savedCashRegister = await queryRunner.manager.save(cashRegister);

      // Create opening movement
      const openingMovement = queryRunner.manager.create(CashMovement, {
        cashRegisterId: savedCashRegister.id,
        type: MovementType.OPENING,
        amount: dto.openingBalance,
        balanceBefore: 0,
        balanceAfter: dto.openingBalance,
        description: 'Cash register opening',
        userId
      });

      await queryRunner.manager.save(openingMovement);
      await queryRunner.commitTransaction();

      return savedCashRegister;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async closeCashRegister(id: string, dto: CloseCashRegisterDto, userId: string): Promise<CashRegister> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cashRegister = await this.findOne(id);

      if (cashRegister.status !== CashRegisterStatus.OPEN) {
        throw new ConflictException('Cash register is not open');
      }

      if (cashRegister.userId !== userId) {
        throw new BadRequestException('You can only close your own cash register');
      }

      // Calculate expected balance
      const expectedBalance = await this.calculateExpectedBalance(id);
      const difference = dto.totalCounted - expectedBalance;

      // Update cash register
      cashRegister.status = CashRegisterStatus.CLOSED;
      cashRegister.closedAt = new Date();
      cashRegister.closedBy = userId;
      cashRegister.closingBalance = expectedBalance;
      cashRegister.expectedBalance = expectedBalance;
      cashRegister.actualBalance = dto.totalCounted;
      cashRegister.difference = difference;
      cashRegister.cashCount = dto.cashCount;
      cashRegister.totalCounted = dto.totalCounted;
      cashRegister.closingNotes = dto.closingNotes;
      cashRegister.discrepancyReason = dto.discrepancyReason;

      // Create closing movement
      const closingMovement = queryRunner.manager.create(CashMovement, {
        cashRegisterId: id,
        type: MovementType.CLOSING,
        amount: expectedBalance,
        balanceBefore: expectedBalance,
        balanceAfter: 0,
        description: 'Cash register closing',
        notes: dto.closingNotes,
        userId
      });

      // If there's a difference, create an adjustment movement
      if (Math.abs(difference) > 0.01) {
        const adjustmentMovement = queryRunner.manager.create(CashMovement, {
          cashRegisterId: id,
          type: MovementType.ADJUSTMENT,
          category: difference > 0 ? MovementCategory.CASH_IN : MovementCategory.CASH_OUT,
          amount: Math.abs(difference),
          balanceBefore: expectedBalance,
          balanceAfter: dto.totalCounted,
          description: `Cash ${difference > 0 ? 'surplus' : 'shortage'} on closing`,
          notes: dto.discrepancyReason,
          userId
        });
        await queryRunner.manager.save(adjustmentMovement);
      }

      await queryRunner.manager.save(closingMovement);
      await queryRunner.manager.save(cashRegister);
      await queryRunner.commitTransaction();

      return cashRegister;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addMovement(dto: CreateMovementDto, userId: string): Promise<CashMovement> {
    const currentSession = await this.getCurrentSession(userId);
    
    if (!currentSession) {
      throw new BadRequestException('No open cash register session found');
    }

    const currentBalance = await this.calculateCurrentBalance(currentSession.id);
    let newBalance = currentBalance;

    // Calculate new balance based on movement type
    switch (dto.type) {
      case MovementType.SALE:
      case MovementType.DEPOSIT:
        newBalance += dto.amount;
        break;
      case MovementType.EXPENSE:
      case MovementType.REFUND:
      case MovementType.WITHDRAWAL:
        newBalance -= dto.amount;
        if (newBalance < 0) {
          throw new BadRequestException('Insufficient funds in cash register');
        }
        break;
    }

    const movement = this.cashMovementRepository.create({
      cashRegisterId: currentSession.id,
      type: dto.type,
      category: dto.category,
      amount: dto.amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: dto.description,
      notes: dto.notes,
      documentNumber: dto.documentNumber,
      documentType: dto.documentType,
      supplierName: dto.supplierName,
      supplierNit: dto.supplierNit,
      paymentMethod: dto.paymentMethod,
      userId
    });

    // Update cash register totals
    await this.updateCashRegisterTotals(currentSession.id, dto.type, dto.amount);

    return this.cashMovementRepository.save(movement);
  }

  async addExpense(dto: CreateExpenseDto, userId: string): Promise<CashMovement> {
    const movementDto: CreateMovementDto = {
      type: MovementType.EXPENSE,
      category: dto.category,
      amount: dto.amount,
      description: dto.description,
      notes: dto.notes,
      documentNumber: dto.documentNumber,
      supplierName: dto.supplierName,
      supplierNit: dto.supplierNit
    };

    return this.addMovement(movementDto, userId);
  }

  async addSaleMovement(saleData: any, userId: string): Promise<void> {
    const currentSession = await this.getCurrentSession(userId);
    
    if (!currentSession) {
      // Sale can proceed without an open cash register
      // but movement won't be recorded
      return;
    }

    // Group payments by method
    for (const payment of saleData.payments) {
      if (payment.method === 'CASH') {
        const movementDto: CreateMovementDto = {
          type: MovementType.SALE,
          amount: payment.amount,
          description: `Sale ${saleData.saleNumber}`,
          paymentMethod: payment.method
        };
        await this.addMovement(movementDto, userId);
      }
    }
  }

  async makeCashAdjustment(dto: CashAdjustmentDto, userId: string): Promise<CashMovement> {
    const movementDto: CreateMovementDto = {
      type: MovementType.ADJUSTMENT,
      category: dto.amount > 0 ? MovementCategory.CASH_IN : MovementCategory.CASH_OUT,
      amount: Math.abs(dto.amount),
      description: dto.reason,
      notes: dto.notes
    };

    return this.addMovement(movementDto, userId);
  }

  async getSummary(cashRegisterId?: string, userId?: string): Promise<CashRegisterSummaryDto> {
    let cashRegister: CashRegister;

    if (cashRegisterId) {
      cashRegister = await this.findOne(cashRegisterId);
    } else if (userId) {
      cashRegister = await this.getCurrentSession(userId);
      if (!cashRegister) {
        throw new NotFoundException('No open cash register session found');
      }
    } else {
      throw new BadRequestException('Either cashRegisterId or userId must be provided');
    }

    const currentBalance = await this.calculateCurrentBalance(cashRegister.id);
    const movements = await this.cashMovementRepository.count({
      where: { cashRegisterId: cashRegister.id }
    });

    return {
      cashRegisterId: cashRegister.id,
      sessionNumber: cashRegister.sessionNumber,
      status: cashRegister.status,
      openedAt: cashRegister.openedAt,
      closedAt: cashRegister.closedAt,
      openingBalance: cashRegister.openingBalance,
      currentBalance,
      totalSales: cashRegister.totalSales,
      totalExpenses: cashRegister.totalExpenses,
      totalCashSales: cashRegister.totalCashSales,
      totalCardSales: cashRegister.totalCardSales,
      totalDigitalSales: cashRegister.totalDigitalSales,
      totalCreditSales: cashRegister.totalCreditSales,
      movements
    };
  }

  async getMovements(cashRegisterId: string): Promise<CashMovement[]> {
    return this.cashMovementRepository.find({
      where: { cashRegisterId },
      order: { createdAt: 'DESC' }
    });
  }

  async findAll(filters?: any): Promise<CashRegister[]> {
    const query = this.cashRegisterRepository.createQueryBuilder('cashRegister');

    if (filters?.userId) {
      query.andWhere('cashRegister.userId = :userId', { userId: filters.userId });
    }

    if (filters?.status) {
      query.andWhere('cashRegister.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      query.andWhere('cashRegister.openedAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('cashRegister.openedAt <= :endDate', { endDate: filters.endDate });
    }

    return query.orderBy('cashRegister.openedAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<CashRegister> {
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: { id }
    });

    if (!cashRegister) {
      throw new NotFoundException(`Cash register ${id} not found`);
    }

    return cashRegister;
  }

  // Helper methods
  private async generateSessionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastSession = await this.cashRegisterRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' }
    });

    let sequence = 1;
    if (lastSession && lastSession.sessionNumber.includes(year.toString())) {
      const lastNumber = parseInt(lastSession.sessionNumber.split('-').pop() || '0');
      sequence = lastNumber + 1;
    }

    return `CASH-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private async calculateCurrentBalance(cashRegisterId: string): Promise<number> {
    const cashRegister = await this.findOne(cashRegisterId);
    const movements = await this.cashMovementRepository.find({
      where: { cashRegisterId }
    });

    let balance = cashRegister.openingBalance;

    for (const movement of movements) {
      if (movement.type === MovementType.OPENING || movement.type === MovementType.CLOSING) {
        continue;
      }

      switch (movement.type) {
        case MovementType.SALE:
        case MovementType.DEPOSIT:
        case MovementType.ADJUSTMENT:
          if (movement.category === MovementCategory.CASH_IN) {
            balance += movement.amount;
          } else if (movement.category === MovementCategory.CASH_OUT) {
            balance -= movement.amount;
          }
          break;
        case MovementType.EXPENSE:
        case MovementType.REFUND:
        case MovementType.WITHDRAWAL:
          balance -= movement.amount;
          break;
      }
    }

    return balance;
  }

  private async calculateExpectedBalance(cashRegisterId: string): Promise<number> {
    return this.calculateCurrentBalance(cashRegisterId);
  }

  private async updateCashRegisterTotals(cashRegisterId: string, type: MovementType, amount: number): Promise<void> {
    const cashRegister = await this.findOne(cashRegisterId);

    switch (type) {
      case MovementType.SALE:
        cashRegister.totalSales += amount;
        cashRegister.totalCashSales += amount; // Assuming cash for now
        cashRegister.totalTransactions++;
        break;
      case MovementType.EXPENSE:
        cashRegister.totalExpenses += amount;
        break;
      case MovementType.REFUND:
        cashRegister.totalRefunds += amount;
        break;
      case MovementType.DEPOSIT:
        cashRegister.totalDeposits += amount;
        break;
      case MovementType.WITHDRAWAL:
        cashRegister.totalWithdrawals += amount;
        break;
    }

    await this.cashRegisterRepository.save(cashRegister);
  }

  // Integration methods
  
  /**
   * Get current open session for a user
   */
  async getCurrentSession(userId: string): Promise<CashRegister | null> {
    return this.cashRegisterRepository.findOne({
      where: {
        userId,
        status: CashRegisterStatus.OPEN
      },
      order: {
        openedAt: 'DESC'
      }
    });
  }

  /**
   * Register sale payment in cash register
   */
  async registerSalePayment(sessionId: string, sale: any): Promise<void> {
    const cashRegister = await this.findOne(sessionId);
    
    if (cashRegister.status !== CashRegisterStatus.OPEN) {
      throw new BadRequestException(`Cash register ${sessionId} is not open`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create movements for each payment
      for (const payment of sale.payments || []) {
        const movement = queryRunner.manager.create(CashMovement, {
          cashRegisterId: sessionId,
          type: MovementType.SALE,
          category: MovementCategory.CASH_IN,
          amount: payment.amount,
          paymentMethod: payment.method,
          referenceType: 'sale',
          referenceId: sale.id,
          documentNumber: sale.saleNumber,
          description: `Sale ${sale.saleNumber}`,
          userId: sale.userId,
          balanceBefore: 0, // Will be calculated
          balanceAfter: 0, // Will be calculated
          createdAt: new Date()
        });
        
        await queryRunner.manager.save(movement);
        
        // Update session totals
        if (payment.method === 'cash') {
          cashRegister.totalCashSales = (cashRegister.totalCashSales || 0) + payment.amount;
        } else if (payment.method === 'card') {
          cashRegister.totalCardSales = (cashRegister.totalCardSales || 0) + payment.amount;
        } else {
          cashRegister.totalOtherSales = (cashRegister.totalOtherSales || 0) + payment.amount;
        }
      }
      
      cashRegister.totalSales = (cashRegister.totalSales || 0) + sale.total;
      cashRegister.totalTransactions = (cashRegister.totalTransactions || 0) + 1;
      
      await queryRunner.manager.save(cashRegister);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Revert sale payment from cash register
   */
  async revertSalePayment(sessionId: string, sale: any, reason: string): Promise<void> {
    const cashRegister = await this.findOne(sessionId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create reversal movements
      for (const payment of sale.payments || []) {
        const movement = queryRunner.manager.create(CashMovement, {
          cashRegisterId: sessionId,
          type: MovementType.REFUND,
          category: MovementCategory.CASH_OUT,
          amount: payment.amount,
          paymentMethod: payment.method,
          referenceType: 'sale_cancellation',
          referenceId: sale.id,
          documentNumber: sale.saleNumber,
          description: `Cancellation of sale ${sale.saleNumber}: ${reason}`,
          userId: sale.cancelledBy || sale.userId,
          balanceBefore: 0, // Will be calculated
          balanceAfter: 0 // Will be calculated
        });
        
        await queryRunner.manager.save(movement);
        
        // Update session totals
        if (payment.method === 'cash') {
          cashRegister.totalCashSales = Math.max(0, (cashRegister.totalCashSales || 0) - payment.amount);
        } else if (payment.method === 'card') {
          cashRegister.totalCardSales = Math.max(0, (cashRegister.totalCardSales || 0) - payment.amount);
        } else {
          cashRegister.totalOtherSales = Math.max(0, (cashRegister.totalOtherSales || 0) - payment.amount);
        }
      }
      
      cashRegister.totalSales = Math.max(0, (cashRegister.totalSales || 0) - sale.total);
      cashRegister.totalRefunds = (cashRegister.totalRefunds || 0) + sale.total;
      
      await queryRunner.manager.save(cashRegister);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Register a generic payment in cash register
   */
  async registerPayment(sessionId: string, paymentData: any): Promise<void> {
    const movement = this.cashMovementRepository.create({
      cashRegisterId: sessionId,
      type: paymentData.type || MovementType.DEPOSIT,
      category: paymentData.amount > 0 ? MovementCategory.CASH_IN : MovementCategory.CASH_OUT,
      amount: Math.abs(paymentData.amount),
      paymentMethod: paymentData.method,
      referenceType: paymentData.referenceType,
      referenceId: paymentData.referenceId,
      documentNumber: paymentData.reference,
      description: paymentData.description,
      userId: paymentData.userId,
      balanceBefore: 0, // Will be calculated
      balanceAfter: 0 // Will be calculated
    });
    
    await this.cashMovementRepository.save(movement);
  }

  /**
   * Generate Z Report (daily summary)
   */
  async generateZReport(sessionId: string): Promise<any> {
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: { id: sessionId }
    });
    
    if (!cashRegister) {
      throw new NotFoundException(`Cash register session ${sessionId} not found`);
    }

    const movements = await this.cashMovementRepository.find({
      where: { cashRegisterId: sessionId },
      order: { createdAt: 'ASC' }
    });

    // Group movements by type and payment method
    const salesByMethod = { cash: 0, card: 0, other: 0 };
    const refundsByMethod = { cash: 0, card: 0, other: 0 };
    let totalExpenses = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    movements.forEach(movement => {
      const method = movement.paymentMethod || 'cash';
      const methodKey = ['cash', 'card'].includes(method) ? method : 'other';
      
      switch (movement.type) {
        case MovementType.SALE:
          salesByMethod[methodKey] += movement.amount;
          break;
        case MovementType.REFUND:
          refundsByMethod[methodKey] += movement.amount;
          break;
        case MovementType.EXPENSE:
          totalExpenses += movement.amount;
          break;
        case MovementType.DEPOSIT:
          totalDeposits += movement.amount;
          break;
        case MovementType.WITHDRAWAL:
          totalWithdrawals += movement.amount;
          break;
      }
    });

    const totalSales = Object.values(salesByMethod).reduce((a, b) => a + b, 0);
    const totalRefunds = Object.values(refundsByMethod).reduce((a, b) => a + b, 0);
    const netSales = totalSales - totalRefunds;
    
    const expectedCash = cashRegister.openingBalance + 
                        salesByMethod.cash - 
                        refundsByMethod.cash - 
                        totalExpenses - 
                        totalWithdrawals + 
                        totalDeposits;

    return {
      sessionId,
      sessionNumber: cashRegister.sessionNumber,
      date: new Date(),
      openedAt: cashRegister.openedAt,
      closedAt: cashRegister.closedAt || null,
      status: cashRegister.status,
      
      sales: {
        count: cashRegister.totalTransactions,
        total: totalSales,
        byMethod: salesByMethod
      },
      
      refunds: {
        total: totalRefunds,
        byMethod: refundsByMethod
      },
      
      expenses: {
        total: totalExpenses
      },
      
      deposits: {
        total: totalDeposits
      },
      
      withdrawals: {
        total: totalWithdrawals
      },
      
      netSales,
      
      cashFlow: {
        opening: cashRegister.openingBalance,
        expectedCash,
        physicalCash: cashRegister.closingCashAmount || 0,
        difference: cashRegister.discrepancy || 0
      },
      
      movements: movements.length,
      terminal: cashRegister.terminalId,
      operator: cashRegister.userId
    };
  }

  /**
   * Close session with physical count
   */
  async closeSession(sessionId: string, physicalCash: number, userId: string): Promise<any> {
    const cashRegister = await this.findOne(sessionId);
    
    if (cashRegister.status !== CashRegisterStatus.OPEN) {
      throw new BadRequestException(`Cash register ${sessionId} is not open`);
    }
    
    if (cashRegister.userId !== userId) {
      throw new BadRequestException('You can only close your own cash register session');
    }

    // Calculate expected balance
    const expectedBalance = await this.calculateExpectedBalance(sessionId);
    const discrepancy = physicalCash - expectedBalance;

    // Update cash register
    cashRegister.status = CashRegisterStatus.CLOSED;
    cashRegister.closedAt = new Date();
    cashRegister.closedBy = userId;
    cashRegister.closingCashAmount = physicalCash;
    cashRegister.expectedClosingBalance = expectedBalance;
    cashRegister.discrepancy = discrepancy;
    
    await this.cashRegisterRepository.save(cashRegister);

    // Create closing movement
    const closingMovement = this.cashMovementRepository.create({
      cashRegisterId: sessionId,
      type: MovementType.CLOSING,
      category: MovementCategory.SYSTEM,
      amount: physicalCash,
      description: `Cash register closing. Expected: ${expectedBalance}, Physical: ${physicalCash}, Difference: ${discrepancy}`,
      userId,
      balanceBefore: expectedBalance,
      balanceAfter: 0
    });
    
    await this.cashMovementRepository.save(closingMovement);

    return {
      session: cashRegister,
      summary: {
        expectedCash: expectedBalance,
        physicalCash,
        discrepancy,
        status: Math.abs(discrepancy) < 1000 ? 'balanced' : 'discrepancy_detected'
      }
    };
  }
}
