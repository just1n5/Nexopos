import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from './entities/customer.entity';
import { CustomerCredit, CreditType, CreditStatus } from './entities/customer-credit.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerCredit)
    private creditRepository: Repository<CustomerCredit>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a new customer
   */
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Check if customer already exists
    const existing = await this.customerRepository.findOne({
      where: {
        documentType: createCustomerDto.documentType,
        documentNumber: createCustomerDto.documentNumber
      }
    });

    if (existing) {
      throw new BadRequestException(
        `Customer with ${createCustomerDto.documentType} ${createCustomerDto.documentNumber} already exists`
      );
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      creditAvailable: createCustomerDto.creditLimit || 0
    });

    return this.customerRepository.save(customer);
  }

  /**
   * Get all customers
   */
  async findAll(filters?: {
    status?: CustomerStatus;
    type?: CustomerType;
    hasCredit?: boolean;
    hasBalance?: boolean;
  }): Promise<Customer[]> {
    const query = this.customerRepository.createQueryBuilder('customer');

    if (filters?.status) {
      query.andWhere('customer.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('customer.type = :type', { type: filters.type });
    }

    if (filters?.hasCredit === true) {
      query.andWhere('customer.creditEnabled = true');
      query.andWhere('customer.creditLimit > 0');
    }

    if (filters?.hasBalance === true) {
      query.andWhere('customer.balance > 0');
    }

    return query.orderBy('customer.firstName', 'ASC').getMany();
  }

  /**
   * Get a customer by ID
   */
  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['credits']
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return customer;
  }

  /**
   * Update a customer
   */
  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    
    // If credit limit changes, update available credit
    if (updateCustomerDto.creditLimit !== undefined) {
      updateCustomerDto['creditAvailable'] = 
        updateCustomerDto.creditLimit - customer.creditUsed;
    }

    await this.customerRepository.update(id, updateCustomerDto);
    
    return this.findOne(id);
  }

  /**
   * Add credit to customer (from a sale)
   */
  async addCredit(
    customerId: string,
    amount: number,
    referenceId: string,
    dueDate?: Date,
    description?: string
  ): Promise<CustomerCredit> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await this.findOne(customerId);

      // Check if credit is enabled
      if (!customer.creditEnabled) {
        throw new BadRequestException(`Credit is not enabled for customer ${customerId}`);
      }

      // Check credit limit
      const newCreditUsed = customer.creditUsed + amount;
      if (newCreditUsed > customer.creditLimit) {
        throw new BadRequestException(
          `Credit limit exceeded. Available: ${customer.creditAvailable}, Requested: ${amount}`
        );
      }

      // Create credit record
      const credit = queryRunner.manager.create(CustomerCredit, {
        customerId,
        type: CreditType.SALE,
        amount,
        balance: amount,
        referenceType: 'sale',
        referenceId,
        dueDate: dueDate || this.calculateDueDate(customer.creditDays),
        description,
        status: CreditStatus.PENDING
      });

      const savedCredit = await queryRunner.manager.save(credit);

      // Update customer balances
      customer.creditUsed = newCreditUsed;
      customer.creditAvailable = customer.creditLimit - newCreditUsed;
      customer.balance += amount;
      customer.totalPurchases += amount;
      customer.purchaseCount += 1;
      customer.lastPurchaseDate = new Date();

      await queryRunner.manager.save(customer);
      await queryRunner.commitTransaction();

      return savedCredit;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process a payment to reduce credit
   */
  async reduceCredit(
    customerId: string,
    amount: number,
    paymentId: string
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await this.findOne(customerId);
      
      if (customer.balance <= 0) {
        throw new BadRequestException(`Customer ${customerId} has no outstanding balance`);
      }

      // Get pending credits (oldest first)
      const pendingCredits = await queryRunner.manager.find(CustomerCredit, {
        where: {
          customerId,
          status: CreditStatus.PENDING
        },
        order: {
          createdAt: 'ASC'
        }
      });

      let remainingAmount = amount;

      // Apply payment to oldest credits first (FIFO)
      for (const credit of pendingCredits) {
        if (remainingAmount <= 0) break;

        const paymentAmount = Math.min(remainingAmount, credit.balance);
        
        credit.paidAmount += paymentAmount;
        credit.updateBalance();
        
        await queryRunner.manager.save(credit);
        
        remainingAmount -= paymentAmount;
      }

      // Create payment record
      const paymentCredit = queryRunner.manager.create(CustomerCredit, {
        customerId,
        type: CreditType.PAYMENT,
        amount: -amount, // Negative for payment
        referenceType: 'payment',
        referenceId: paymentId,
        status: CreditStatus.PAID,
        paidDate: new Date()
      });

      await queryRunner.manager.save(paymentCredit);

      // Update customer balances
      customer.creditUsed = Math.max(0, customer.creditUsed - amount);
      customer.creditAvailable = customer.creditLimit - customer.creditUsed;
      customer.balance = Math.max(0, customer.balance - amount);
      customer.totalPayments += amount;
      customer.lastPaymentDate = new Date();

      await queryRunner.manager.save(customer);
      await queryRunner.commitTransaction();

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remove credit (when sale is cancelled)
   */
  async removeCredit(customerId: string, referenceId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const credit = await queryRunner.manager.findOne(CustomerCredit, {
        where: {
          customerId,
          referenceId,
          type: CreditType.SALE
        }
      });

      if (!credit) {
        throw new NotFoundException(`Credit for reference ${referenceId} not found`);
      }

      if (credit.paidAmount > 0) {
        throw new BadRequestException(
          `Cannot remove credit with payments. Paid: ${credit.paidAmount}`
        );
      }

      const customer = await this.findOne(customerId);

      // Update customer balances
      customer.creditUsed -= credit.amount;
      customer.creditAvailable = customer.creditLimit - customer.creditUsed;
      customer.balance -= credit.amount;
      customer.totalPurchases -= credit.amount;
      customer.purchaseCount = Math.max(0, customer.purchaseCount - 1);

      // Cancel the credit
      credit.status = CreditStatus.CANCELLED;
      
      await queryRunner.manager.save(credit);
      await queryRunner.manager.save(customer);
      await queryRunner.commitTransaction();

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get customers with overdue credits
   */
  async getOverdueCustomers(): Promise<any[]> {
    const overdueCredits = await this.creditRepository
      .createQueryBuilder('credit')
      .leftJoinAndSelect('credit.customer', 'customer')
      .where('credit.status = :status', { status: CreditStatus.OVERDUE })
      .orWhere('(credit.status IN (:...statuses) AND credit.dueDate < :now)', {
        statuses: [CreditStatus.PENDING, CreditStatus.PARTIAL],
        now: new Date()
      })
      .getMany();

    // Group by customer
    const customerMap = new Map();
    
    for (const credit of overdueCredits) {
      const customerId = credit.customerId;
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer: credit.customer,
          credits: [],
          totalOverdue: 0,
          oldestDueDate: credit.dueDate
        });
      }
      
      const data = customerMap.get(customerId);
      data.credits.push(credit);
      data.totalOverdue += credit.balance;
      
      if (credit.dueDate < data.oldestDueDate) {
        data.oldestDueDate = credit.dueDate;
      }
    }

    return Array.from(customerMap.values());
  }

  /**
   * Send payment reminder via WhatsApp (placeholder)
   */
  async sendPaymentReminder(customerId: string, creditId?: string): Promise<void> {
    const customer = await this.findOne(customerId);
    
    if (!customer.whatsapp) {
      throw new BadRequestException(`Customer ${customerId} has no WhatsApp number`);
    }

    if (!customer.acceptsReminders) {
      throw new BadRequestException(`Customer ${customerId} has opted out of reminders`);
    }

    // TODO: Integrate with WhatsApp Business API
    // For now, just update the reminder sent count
    if (creditId) {
      const credit = await this.creditRepository.findOne({ where: { id: creditId } });
      if (credit) {
        credit.remindersSent += 1;
        credit.lastReminderDate = new Date();
        await this.creditRepository.save(credit);
      }
    }

    console.log(`[WhatsApp Reminder] Sending to ${customer.whatsapp}`);
  }

  /**
   * Calculate due date based on credit days
   */
  private calculateDueDate(creditDays: number): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);
    return dueDate;
  }

  /**
   * Find all active customers
   */
  async findActive(): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { status: CustomerStatus.ACTIVE },
      order: { firstName: 'ASC' }
    });
  }

  /**
   * Find customers with credit enabled
   */
  async findWithCredit(): Promise<Customer[]> {
    return this.customerRepository.find({
      where: {
        creditEnabled: true,
        status: CustomerStatus.ACTIVE
      },
      order: { firstName: 'ASC' }
    });
  }

  /**
   * Find customer by document number
   */
  async findByDocument(documentNumber: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { documentNumber }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with document ${documentNumber} not found`);
    }

    return customer;
  }

  /**
   * Remove (deactivate) a customer
   */
  async remove(id: string): Promise<Customer> {
    const customer = await this.findOne(id);
    
    // Check if customer has outstanding balance
    if (customer.balance > 0) {
      throw new BadRequestException(
        `Cannot remove customer with outstanding balance: ${customer.balance}`
      );
    }

    // Soft delete by marking as inactive
    customer.status = CustomerStatus.INACTIVE;
    
    return this.customerRepository.save(customer);
  }

  /**
   * Get customer credit summary
   */
  async getCreditSummary(customerId: string): Promise<any> {
    const customer = await this.findOne(customerId);
    
    const credits = await this.creditRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' }
    });

    const pendingCredits = credits.filter(c => 
      c.type === CreditType.SALE && 
      c.status !== CreditStatus.PAID && 
      c.status !== CreditStatus.CANCELLED
    );

    const overdueCredits = pendingCredits.filter(c => c.isOverdue);

    return {
      customer: {
        id: customer.id,
        name: customer.fullName,
        creditEnabled: customer.creditEnabled,
        creditLimit: customer.creditLimit,
        creditUsed: customer.creditUsed,
        creditAvailable: customer.creditAvailable,
        balance: customer.balance,
        creditUtilization: customer.creditUtilization
      },
      credits: {
        total: credits.length,
        pending: pendingCredits.length,
        overdue: overdueCredits.length,
        totalAmount: pendingCredits.reduce((sum, c) => sum + c.balance, 0),
        overdueAmount: overdueCredits.reduce((sum, c) => sum + c.balance, 0)
      },
      history: credits
    };
  }
}
