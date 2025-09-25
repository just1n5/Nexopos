import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CustomerCredit, CreditStatus, CreditType } from '../customers/entities/customer-credit.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Payment, PaymentMethod } from '../sales/entities/payment.entity';
import { CustomersService } from '../customers/customers.service';
import { SalesService } from '../sales/sales.service';
import { CreateCreditPaymentDto, CreditPaymentMethodDto } from './dto/create-credit-payment.dto';

type CreditStatusResponse = 'pending' | 'paid' | 'overdue';

type CreditPaymentResponse = {
  id: string;
  creditSaleId: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'other';
  date: Date;
  notes?: string;
  receivedBy?: string;
};

type CreditSaleResponse = {
  id: string;
  saleId?: string;
  customerId: string;
  customer?: Customer;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  dueDate?: Date;
  status: CreditStatusResponse;
  payments: CreditPaymentResponse[];
  sale?: Sale;
  createdAt: Date;
  updatedAt: Date;
};

interface CreditFilters {
  customerId?: string;
  status?: CreditStatusResponse;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CustomerCredit)
    private readonly creditRepository: Repository<CustomerCredit>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly customersService: CustomersService,
    private readonly salesService: SalesService,
  ) {}

  async findAll(filters: CreditFilters = {}): Promise<CreditSaleResponse[]> {
    const query = this.creditRepository.createQueryBuilder('credit')
      .leftJoinAndSelect('credit.customer', 'customer')
      .where('credit.type = :type', { type: CreditType.SALE });

    if (filters.customerId) {
      query.andWhere('credit.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.status) {
      const statuses = this.mapStatusFilter(filters.status);
      query.andWhere('credit.status IN (:...statuses)', { statuses });
    }

    if (filters.startDate) {
      query.andWhere('credit.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('credit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const credits = await query.orderBy('credit.createdAt', 'DESC').getMany();
    const saleIds = credits
      .map((credit) => credit.referenceId)
      .filter((value): value is string => Boolean(value));

    const salesMap = await this.loadSalesMap(saleIds);

    const result: CreditSaleResponse[] = [];
    for (const credit of credits) {
      const sale = credit.referenceId ? salesMap.get(credit.referenceId) : undefined;
      const payments = await this.getPaymentsForCredit(credit);
      result.push(this.mapCreditSale(credit, sale, payments));
    }

    return result;
  }

  async findOne(id: string): Promise<CreditSaleResponse> {
    const credit = await this.creditRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!credit || credit.type !== CreditType.SALE) {
      throw new NotFoundException(`Credit sale ${id} not found`);
    }

    const sale = credit.referenceId ? await this.saleRepository.findOne({
      where: { id: credit.referenceId },
      relations: ['items', 'payments'],
    }) : undefined;

    const payments = await this.getPaymentsForCredit(credit);

    return this.mapCreditSale(credit, sale, payments);
  }

  async getPayments(creditId: string): Promise<CreditPaymentResponse[]> {
    const credit = await this.creditRepository.findOne({ where: { id: creditId } });
    if (!credit) {
      throw new NotFoundException(`Credit ${creditId} not found`);
    }

    return this.getPaymentsForCredit(credit);
  }

  async addPayment(creditId: string, dto: CreateCreditPaymentDto, _userId: string): Promise<CreditPaymentResponse> {
    const credit = await this.creditRepository.findOne({
      where: { id: creditId },
      relations: ['customer'],
    });

    if (!credit || credit.type !== CreditType.SALE) {
      throw new NotFoundException(`Credit sale ${creditId} not found`);
    }

    if (!credit.referenceId) {
      throw new BadRequestException('Credit sale has no associated sale reference');
    }

    const [payment] = await this.salesService.addPayment(credit.referenceId, {
      amount: dto.amount,
      method: this.mapPaymentMethod(dto.paymentMethod),
      notes: dto.notes,
    });

    await this.customersService.reduceCredit(credit.customerId, dto.amount, payment.id);

    return this.mapPayment(payment, creditId);
  }

  async getSummary() {
    const credits = await this.creditRepository.find({
      where: { type: CreditType.SALE },
    });

    const pendingCredits = credits.filter((credit) => this.mapCreditStatus(credit.status) === 'pending');
    const overdueCredits = credits.filter((credit) => this.mapCreditStatus(credit.status) === 'overdue');

    return {
      totalCredits: credits.length,
      totalPending: pendingCredits.reduce((sum, credit) => sum + Number(credit.balance || 0), 0),
      totalOverdue: overdueCredits.reduce((sum, credit) => sum + Number(credit.balance || 0), 0),
      creditsCount: credits.length,
      pendingCount: pendingCredits.length,
      overdueCount: overdueCredits.length,
    };
  }

  async sendReminder(creditId: string, method: 'whatsapp' | 'sms' | 'email') {
    const credit = await this.creditRepository.findOne({
      where: { id: creditId },
      relations: ['customer'],
    });

    if (!credit || credit.type !== CreditType.SALE) {
      throw new NotFoundException(`Credit sale ${creditId} not found`);
    }

    await this.customersService.sendPaymentReminder(credit.customerId, credit.id);

    return { success: true, method };
  }

  private mapCreditSale(credit: CustomerCredit, sale?: Sale, payments: CreditPaymentResponse[] = []): CreditSaleResponse {
    return {
      id: credit.id,
      saleId: credit.referenceId,
      customerId: credit.customerId,
      customer: credit.customer,
      totalAmount: Number(credit.amount || 0),
      paidAmount: Number(credit.paidAmount || 0),
      remainingBalance: Number(credit.balance || 0),
      dueDate: credit.dueDate,
      status: this.mapCreditStatus(credit.status),
      payments,
      sale,
      createdAt: credit.createdAt,
      updatedAt: credit.updatedAt,
    };
  }

  private mapCreditStatus(status: CreditStatus): CreditStatusResponse {
    switch (status) {
      case CreditStatus.PAID:
        return 'paid';
      case CreditStatus.OVERDUE:
        return 'overdue';
      default:
        return 'pending';
    }
  }

  private mapStatusFilter(status: CreditStatusResponse): CreditStatus[] {
    if (status === 'paid') {
      return [CreditStatus.PAID];
    }

    if (status === 'overdue') {
      return [CreditStatus.OVERDUE];
    }

    return [CreditStatus.PENDING, CreditStatus.PARTIAL];
  }

  private async loadSalesMap(ids: string[]) {
    if (!ids.length) {
      return new Map<string, Sale>();
    }

    const sales = await this.saleRepository.find({
      where: { id: In(ids) },
      relations: ['items', 'payments'],
    });

    return new Map(sales.map((sale) => [sale.id, sale]));
  }

  private async getPaymentsForCredit(credit: CustomerCredit): Promise<CreditPaymentResponse[]> {
    if (!credit.referenceId) {
      return [];
    }

    const payments = await this.paymentRepository.find({
      where: { saleId: credit.referenceId },
      order: { createdAt: 'DESC' },
    });

    return payments.map((payment) => this.mapPayment(payment, credit.id));
  }

  private mapPayment(payment: Payment, creditId: string): CreditPaymentResponse {
    return {
      id: payment.id,
      creditSaleId: creditId,
      amount: Number(payment.amount || 0),
      paymentMethod: this.normalizePaymentMethod(payment.method),
      date: payment.processedAt || payment.createdAt,
      notes: payment.notes,
      receivedBy: payment.processedBy,
    };
  }

  private normalizePaymentMethod(method: PaymentMethod): 'cash' | 'transfer' | 'card' | 'other' {
    switch (method) {
      case PaymentMethod.CASH:
        return 'cash';
      case PaymentMethod.BANK_TRANSFER:
        return 'transfer';
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return 'card';
      default:
        return 'other';
    }
  }

  private mapPaymentMethod(method: CreditPaymentMethodDto): string {
    switch (method) {
      case CreditPaymentMethodDto.CASH:
        return 'CASH';
      case CreditPaymentMethodDto.TRANSFER:
        return 'BANK_TRANSFER';
      case CreditPaymentMethodDto.CARD:
        return 'CREDIT_CARD';
      default:
        return 'OTHER';
    }
  }
}
