import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Sale, SaleStatus, SaleType } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { CreateSaleDto, QuickSaleDto, CalculateSaleDto } from './dto/create-sale.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private dataSource: DataSource,
    private productsService: ProductsService,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate and calculate totals
      const calculations = await this.calculateTotals(createSaleDto.items);
      
      // Apply overall discount if provided
      let finalTotal = calculations.total;
      let finalDiscountAmount = calculations.discountAmount;
      
      if (createSaleDto.discountPercent > 0) {
        finalDiscountAmount += calculations.subtotal * (createSaleDto.discountPercent / 100);
        finalTotal = calculations.subtotal - finalDiscountAmount + calculations.taxAmount;
      } else if (createSaleDto.discountAmount > 0) {
        finalDiscountAmount += createSaleDto.discountAmount;
        finalTotal = calculations.subtotal - finalDiscountAmount + calculations.taxAmount;
      }

      // Validate payment amounts
      const totalPayment = createSaleDto.payments.reduce((sum, p) => sum + p.amount, 0);
      
      if (createSaleDto.type === SaleType.REGULAR && totalPayment < finalTotal) {
        throw new BadRequestException(`Payment amount (${totalPayment}) is less than sale total (${finalTotal})`);
      }

      // Generate sale number
      const saleNumber = await this.generateSaleNumber();

      // Create sale
      const sale = queryRunner.manager.create(Sale, {
        saleNumber,
        type: createSaleDto.type || SaleType.REGULAR,
        status: SaleStatus.PENDING,
        userId,
        customerId: createSaleDto.customerId,
        subtotal: calculations.subtotal,
        discountAmount: finalDiscountAmount,
        discountPercent: createSaleDto.discountPercent || 0,
        taxAmount: calculations.taxAmount,
        total: finalTotal,
        paidAmount: totalPayment,
        changeAmount: Math.max(0, totalPayment - finalTotal),
        creditAmount: createSaleDto.type === SaleType.CREDIT ? (finalTotal - totalPayment) : 0,
        creditDueDate: createSaleDto.creditDueDate,
        notes: createSaleDto.notes,
      });

      const savedSale = await queryRunner.manager.save(sale);

      // Create sale items
      for (const itemDto of createSaleDto.items) {
        const productInfo = await this.getProductInfo(itemDto.productId, itemDto.productVariantId);
        
        const subtotal = itemDto.quantity * itemDto.unitPrice;
        const itemDiscountAmount = itemDto.discountAmount || (subtotal * (itemDto.discountPercent || 0) / 100);
        const taxableAmount = subtotal - itemDiscountAmount;
        const taxAmount = taxableAmount * (productInfo.taxRate / 100);
        
        const saleItem = queryRunner.manager.create(SaleItem, {
          saleId: savedSale.id,
          productId: itemDto.productId,
          productVariantId: itemDto.productVariantId,
          productName: productInfo.name,
          productSku: productInfo.sku,
          variantName: productInfo.variantName,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          costPrice: productInfo.costPrice,
          discountAmount: itemDiscountAmount,
          discountPercent: itemDto.discountPercent || 0,
          taxRate: productInfo.taxRate,
          taxAmount: taxAmount,
          taxCode: productInfo.taxCode,
          subtotal: subtotal,
          total: subtotal - itemDiscountAmount + taxAmount,
          notes: itemDto.notes,
        });

        await queryRunner.manager.save(saleItem);

        // Update inventory
        await this.updateInventory(
          queryRunner,
          itemDto.productId,
          itemDto.productVariantId,
          -itemDto.quantity
        );
      }

      // Create payments
      for (const paymentDto of createSaleDto.payments) {
        const payment = queryRunner.manager.create(Payment, {
          saleId: savedSale.id,
          method: paymentDto.method,
          status: PaymentStatus.COMPLETED,
          amount: paymentDto.amount,
          receivedAmount: paymentDto.receivedAmount,
          changeGiven: paymentDto.method === 'CASH' ? 
            Math.max(0, (paymentDto.receivedAmount || paymentDto.amount) - paymentDto.amount) : 0,
          transactionRef: paymentDto.transactionRef,
          notes: paymentDto.notes,
          processedBy: userId,
        });

        await queryRunner.manager.save(payment);
      }

      // Update sale status to COMPLETED
      savedSale.status = SaleStatus.COMPLETED;
      await queryRunner.manager.save(savedSale);

      await queryRunner.commitTransaction();
      
      return this.findOne(savedSale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async quickSale(quickSaleDto: QuickSaleDto, userId: string): Promise<Sale> {
    // Find product by barcode or SKU
    const product = await this.findProductByCode(quickSaleDto.productCode);
    if (!product) {
      throw new NotFoundException(`Product with code ${quickSaleDto.productCode} not found`);
    }

    const createSaleDto: CreateSaleDto = {
      items: [{
        productId: product.id,
        quantity: quickSaleDto.quantity || 1,
        unitPrice: product.price,
      }],
      payments: [{
        method: quickSaleDto.paymentMethod,
        amount: product.price * (quickSaleDto.quantity || 1),
        receivedAmount: quickSaleDto.receivedAmount,
      }],
    };

    return this.create(createSaleDto, userId);
  }

  async calculateTotals(items: any[]) {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discountAmount || (itemSubtotal * (item.discountPercent || 0) / 100);
      const productInfo = await this.getProductInfo(item.productId, item.productVariantId);
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = taxableAmount * (productInfo.taxRate / 100);

      subtotal += itemSubtotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
    }

    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  }

  async findAll(filters?: any): Promise<Sale[]> {
    const query = this.saleRepository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.payments', 'payments')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.user', 'user');

    if (filters?.startDate) {
      query.andWhere('sale.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('sale.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.status) {
      query.andWhere('sale.status = :status', { status: filters.status });
    }

    if (filters?.customerId) {
      query.andWhere('sale.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters?.userId) {
      query.andWhere('sale.userId = :userId', { userId: filters.userId });
    }

    return query.orderBy('sale.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['items', 'payments', 'customer', 'user'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async cancelSale(id: string, userId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await this.findOne(id);

      if (sale.status !== SaleStatus.COMPLETED) {
        throw new ConflictException('Only completed sales can be cancelled');
      }

      // Reverse inventory changes
      for (const item of sale.items) {
        await this.updateInventory(
          queryRunner,
          item.productId,
          item.productVariantId,
          item.quantity
        );
      }

      // Update sale status
      sale.status = SaleStatus.CANCELLED;
      await queryRunner.manager.save(sale);

      // Update payment statuses
      for (const payment of sale.payments) {
        payment.status = PaymentStatus.CANCELLED;
        await queryRunner.manager.save(payment);
      }

      await queryRunner.commitTransaction();
      return sale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getDailySummary(date?: Date): Promise<any> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await this.findAll({
      startDate: startOfDay,
      endDate: endOfDay,
      status: SaleStatus.COMPLETED,
    });

    const summary = {
      date: targetDate,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + Number(sale.total), 0),
      totalDiscount: sales.reduce((sum, sale) => sum + Number(sale.discountAmount), 0),
      totalTax: sales.reduce((sum, sale) => sum + Number(sale.taxAmount), 0),
      paymentMethods: {},
      topProducts: [],
    };

    // Group by payment methods
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        if (!summary.paymentMethods[payment.method]) {
          summary.paymentMethods[payment.method] = {
            count: 0,
            amount: 0,
          };
        }
        summary.paymentMethods[payment.method].count++;
        summary.paymentMethods[payment.method].amount += Number(payment.amount);
      });
    });

    return summary;
  }

  // Helper methods

  /**
   * Find all pending sales
   */
  async findPending(): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { status: SaleStatus.PENDING },
      relations: ['items', 'payments'],
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Add a payment to a sale
   */
  async addPayment(saleId: string, paymentDto: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
  }): Promise<Payment[]> {
    const sale = await this.findOne(saleId);
    
    // Convert string method to PaymentMethod enum
    const paymentMethod = PaymentMethod[paymentDto.method.toUpperCase() as keyof typeof PaymentMethod] || PaymentMethod.OTHER;
    
    const payment = this.paymentRepository.create({
      saleId,
      amount: paymentDto.amount,
      method: paymentMethod,
      reference: paymentDto.reference,
      status: PaymentStatus.COMPLETED,
      notes: paymentDto.notes,
      processedAt: new Date()
    });
    
    const savedPayment = await this.paymentRepository.save(payment);
    
    // Update sale paid amount
    sale.paidAmount = (sale.paidAmount || 0) + paymentDto.amount;
    
    // Update credit amount if it's a credit sale
    if (sale.type === SaleType.CREDIT) {
      sale.creditAmount = Math.max(0, sale.total - sale.paidAmount);
    }
    
    await this.saleRepository.save(sale);
    
    return [savedPayment];
  }

  private async generateSaleNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastSale = await this.saleRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastSale && lastSale.saleNumber.includes(year.toString())) {
      const lastNumber = parseInt(lastSale.saleNumber.split('-').pop() || '0');
      sequence = lastNumber + 1;
    }

    return `POS-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private async getProductInfo(productId: string, variantId?: string): Promise<any> {
    try {
      const product = await this.productsService.findOne(productId);
      
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Find the specific variant if variantId is provided
      let variant = null;
      if (variantId && product.variants) {
        variant = product.variants.find(v => v.id === variantId);
        if (!variant) {
          throw new NotFoundException(`Variant with ID ${variantId} not found`);
        }
      }

      return {
        id: productId,
        name: product.name,
        sku: variant?.sku || product.sku,
        variantName: variant?.name || null,
        costPrice: variant?.price || product.basePrice || 0,
        taxRate: 19, // Colombian IVA - this should come from product config
        taxCode: 'IVA',
      };
    } catch (error) {
      console.error('Error getting product info:', error);
      // Return fallback data to not break the sale
      return {
        id: productId,
        name: 'Unknown Product',
        sku: 'UNKNOWN',
        variantName: null,
        costPrice: 0,
        taxRate: 19,
        taxCode: 'IVA',
      };
    }
  }

  private async findProductByCode(code: string): Promise<any> {
    // This should query the product service/repository by barcode or SKU
    // For now, returning mock data
    return {
      id: 'product-id',
      price: 10000,
    };
  }

  private async updateInventory(
    queryRunner: QueryRunner,
    productId: string,
    variantId: string | undefined,
    quantityChange: number
  ): Promise<void> {
    // This should update the inventory module
    // Will be implemented when integrating with inventory module
    console.log(`Updating inventory for product ${productId}, change: ${quantityChange}`);
  }
}
