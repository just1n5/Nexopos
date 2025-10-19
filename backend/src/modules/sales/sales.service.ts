import { Injectable, BadRequestException, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Sale, SaleStatus, SaleType } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { CreateSaleDto, QuickSaleDto, CalculateSaleDto } from './dto/create-sale.dto';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomersService } from '../customers/customers.service';
import { JournalEntryService } from '../accounting/services/journal-entry.service';
import { MovementType } from '../inventory/entities/inventory-movement.entity';
import { toDecimal } from '../../common/utils';
import { poundsToGrams } from '../../common/utils/weight.utils';


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
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => CashRegisterService))
    private cashRegisterService: CashRegisterService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    private journalEntryService: JournalEntryService,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: string, tenantId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Declare variables outside try-catch for post-transaction access
    let savedSale: Sale;
    let inventoryUpdates: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      costPrice: number;
    }> = [];
    let finalTotal: number;
    let roundedTotalPayment: number;

    try {
      // Validate and calculate totals
      const calculations = await this.calculateTotals(createSaleDto.items, tenantId);

      // Apply overall discount if provided
      finalTotal = calculations.total;
      let finalDiscountAmount = calculations.discountAmount;
      
      if (createSaleDto.discountPercent > 0) {
        finalDiscountAmount += calculations.subtotal * (createSaleDto.discountPercent / 100);
        finalTotal = calculations.subtotal - finalDiscountAmount + calculations.taxAmount;
      } else if (createSaleDto.discountAmount > 0) {
        finalDiscountAmount += createSaleDto.discountAmount;
        finalTotal = calculations.subtotal - finalDiscountAmount + calculations.taxAmount;
      }

      // Always round final totals after all calculations
      finalDiscountAmount = toDecimal(finalDiscountAmount);
      finalTotal = toDecimal(finalTotal);

      // Validate payment amounts
      const totalPayment = createSaleDto.payments.reduce((sum, p) => sum + p.amount, 0);

      // Round values to 2 decimal places for safe comparison
      roundedTotalPayment = toDecimal(totalPayment);
      const roundedFinalTotal = toDecimal(finalTotal);

      if (createSaleDto.type === SaleType.REGULAR && roundedTotalPayment < roundedFinalTotal) {
        throw new BadRequestException(`Payment amount (${roundedTotalPayment}) is less than sale total (${roundedFinalTotal})`);
      }

      // Validar crédito ANTES de crear la venta
      if (createSaleDto.type === SaleType.CREDIT && createSaleDto.customerId) {
        const customer = await this.customersService.findOne(createSaleDto.customerId, tenantId);

        if (!customer.creditEnabled) {
          throw new BadRequestException('Credit is not enabled for this customer');
        }

        const creditAmount = toDecimal(finalTotal - roundedTotalPayment);
        if (customer.creditAvailable < creditAmount) {
          throw new BadRequestException(
            `Insufficient credit. Available: ${customer.creditAvailable}, Required: ${creditAmount}`
          );
        }
      }

      // Validar stock disponible ANTES de crear la venta
      for (const itemDto of createSaleDto.items) {
        const productInfo = await this.getProductInfo(itemDto.productId, tenantId, itemDto.productVariantId);

        if (productInfo.stock < itemDto.quantity) {
          const productName = productInfo.name;
          throw new BadRequestException(
            `Stock insuficiente para ${productName}. Disponible: ${productInfo.stock}, Solicitado: ${itemDto.quantity}`
          );
        }
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
        paidAmount: roundedTotalPayment,
        changeAmount: toDecimal(Math.max(0, roundedTotalPayment - finalTotal)),
        creditAmount: createSaleDto.type === SaleType.CREDIT ? toDecimal(finalTotal - roundedTotalPayment) : 0,
        creditDueDate: createSaleDto.creditDueDate,
        notes: createSaleDto.notes,
      });

      savedSale = await queryRunner.manager.save(sale);

      // Create sale items
      for (const itemDto of createSaleDto.items) {
        const productInfo = await this.getProductInfo(itemDto.productId, tenantId, itemDto.productVariantId);

        const subtotal = toDecimal(itemDto.quantity * itemDto.unitPrice);
        const itemDiscountAmount = toDecimal(itemDto.discountAmount || (subtotal * (itemDto.discountPercent || 0) / 100));
        const taxableAmount = toDecimal(subtotal - itemDiscountAmount);
        const taxAmount = toDecimal(taxableAmount * (productInfo.taxRate / 100));
        const total = toDecimal(subtotal - itemDiscountAmount + taxAmount);

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
          total: total,
          notes: itemDto.notes,
        });

        await queryRunner.manager.save(saleItem);

        // Store for later inventory update (after transaction commit)
        inventoryUpdates.push({
          productId: itemDto.productId,
          variantId: itemDto.productVariantId,
          quantity: itemDto.quantity,
          costPrice: productInfo.costPrice
        });
      }

      // Create payments
      for (const paymentDto of createSaleDto.payments) {
        const amount = toDecimal(paymentDto.amount);
        const receivedAmount = toDecimal(paymentDto.receivedAmount || paymentDto.amount);
        const changeGiven = paymentDto.method === 'CASH' ? 
            toDecimal(Math.max(0, receivedAmount - amount)) : 0;

        const payment = queryRunner.manager.create(Payment, {
          saleId: savedSale.id,
          method: paymentDto.method,
          status: PaymentStatus.COMPLETED,
          amount: amount,
          receivedAmount: receivedAmount,
          changeGiven: changeGiven,
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
      await queryRunner.release();

    } catch (error) {
      // Only rollback if transaction is still active
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      throw error;
    }

    // Post-transaction operations (these happen AFTER the main transaction is committed)
    try {
      // Update inventory AFTER committing the transaction to avoid nested transaction conflicts
      for (const update of inventoryUpdates) {
        await this.inventoryService.adjustStock(
          update.productId,
          -update.quantity, // Negative for sales (stock reduction)
          MovementType.SALE,
          userId || 'system',
          {
            variantId: update.variantId,
            referenceType: 'sale',
            referenceId: savedSale.id,
            referenceNumber: savedSale.saleNumber,
            unitCost: update.costPrice,
            notes: 'Stock reduced by sale'
          }
        );
      }

      // If it's a credit sale, create CustomerCredit record using CustomersService
      // This must be done AFTER committing the transaction to avoid deadlocks
      if (createSaleDto.type === SaleType.CREDIT && createSaleDto.customerId) {
        const creditAmount = toDecimal(finalTotal - roundedTotalPayment);

        console.log('[SalesService] Creating credit record:', {
          customerId: createSaleDto.customerId,
          creditAmount,
          saleId: savedSale.id,
          saleNumber: savedSale.saleNumber,
          type: createSaleDto.type
        });

        try {
          const creditRecord = await this.customersService.addCredit(
            createSaleDto.customerId,
            creditAmount,
            savedSale.id,
            tenantId,
            createSaleDto.creditDueDate ? new Date(createSaleDto.creditDueDate) : undefined,
            `Venta a crédito #${savedSale.saleNumber}`
          );

          console.log('[SalesService] Credit record created successfully:', {
            creditId: creditRecord.id,
            amount: creditRecord.amount,
            balance: creditRecord.balance
          });
        } catch (error) {
          console.error('[SalesService] ERROR creating credit record:', error);
          console.error('[SalesService] Error details:', {
            message: error.message,
            stack: error.stack,
            customerId: createSaleDto.customerId,
            creditAmount
          });
          // Re-throw to prevent sale from completing if credit creation fails
          throw new BadRequestException(`Failed to create credit record: ${error.message}`);
        }
      }

      // Register sale in cash register (after successful transaction)
      try {
        console.log('[SalesService] Attempting to register sale in cash register:', {
          saleId: savedSale.id,
          saleNumber: savedSale.saleNumber,
          total: savedSale.total,
          payments: createSaleDto.payments,
          userId
        });
        await this.cashRegisterService.registerSalePayment(
          null, // Will use current session
          {
            id: savedSale.id,
            saleNumber: savedSale.saleNumber,
            total: savedSale.total,
            payments: createSaleDto.payments,
            userId
          }
        );
        console.log('[SalesService] Sale registered in cash register successfully');
      } catch (error) {
        console.error('[SalesService] Error registering sale in cash register:', error);
        console.error('[SalesService] Error stack:', error.stack);
        // Don't fail the sale if cash register registration fails
      }

      // Generate automatic journal entry for the sale (CONTABILIDAD INVISIBLE)
      try {
        console.log('[SalesService] Creating automatic journal entry for sale:', {
          saleId: savedSale.id,
          saleNumber: savedSale.saleNumber,
          total: savedSale.total,
          tenantId
        });

        // Fetch the complete sale with items and payments for the journal entry
        const saleWithRelations = await this.findOne(savedSale.id);

        const journalEntry = await this.journalEntryService.createSaleEntry(
          saleWithRelations,
          tenantId,
          userId
        );

        // Update sale with journal entry reference
        await this.saleRepository.update(savedSale.id, {
          journalEntryId: journalEntry.id
        });

        console.log('[SalesService] Journal entry created successfully:', {
          journalEntryId: journalEntry.id,
          entryNumber: journalEntry.entryNumber
        });
      } catch (error) {
        console.error('[SalesService] Error creating journal entry:', error);
        console.error('[SalesService] Error details:', error.message);
        // Don't fail the sale if journal entry creation fails
        // The accounting can be fixed later
      }

      return this.findOne(savedSale.id);
    } catch (error) {
      // If post-transaction operations fail, log but don't rollback (transaction already committed)
      console.error('[SalesService] Error in post-transaction operations:', error);
      console.error('[SalesService] Sale was created but some operations failed');
      // Return the sale anyway since it was successfully created
      return this.findOne(savedSale.id);
    }
  }

  async quickSale(quickSaleDto: QuickSaleDto, userId: string, tenantId: string): Promise<Sale> {
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

    return this.create(createSaleDto, userId, tenantId);
  }

  async calculateTotals(items: any[], tenantId: string) {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discountAmount || (itemSubtotal * (item.discountPercent || 0) / 100);
      const productInfo = await this.getProductInfo(item.productId, tenantId, item.productVariantId);
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = taxableAmount * (productInfo.taxRate / 100);

      subtotal += itemSubtotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
    }

    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal: toDecimal(subtotal),
      discountAmount: toDecimal(discountAmount),
      taxAmount: toDecimal(taxAmount),
      total: toDecimal(total),
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

    let sale: Sale;

    try {
      sale = await this.findOne(id);

      if (sale.status !== SaleStatus.COMPLETED) {
        throw new ConflictException('Only completed sales can be cancelled');
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
      await queryRunner.release();

    } catch (error) {
      // Only rollback if transaction is still active
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      throw error;
    }

    // Post-transaction operations (reverse inventory AFTER committing the transaction)
    try {
      for (const item of sale.items) {
        await this.inventoryService.adjustStock(
          item.productId,
          item.quantity, // Positive to add stock back
          MovementType.PURCHASE,
          userId || 'system',
          {
            variantId: item.productVariantId,
            referenceType: 'sale',
            referenceId: sale.id,
            referenceNumber: sale.saleNumber,
            unitCost: item.costPrice,
            notes: 'Stock increased by sale cancellation'
          }
        );
      }

      return sale;
    } catch (error) {
      // If inventory reversal fails, log but don't fail the cancellation
      console.error('[SalesService] Error reversing inventory for cancelled sale:', error);
      console.error('[SalesService] Sale was cancelled but inventory was not updated');
      return sale;
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
  }, userId?: string): Promise<Payment[]> {
    // Load sale WITHOUT payments to avoid cascade update issues
    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: ['items', 'customer', 'user']
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${saleId} not found`);
    }

    // Convert string method to PaymentMethod enum
    const paymentMethod = PaymentMethod[paymentDto.method.toUpperCase() as keyof typeof PaymentMethod] || PaymentMethod.OTHER;

    // Build payment data without undefined values
    const paymentData: any = {
      saleId,
      amount: paymentDto.amount,
      method: paymentMethod,
      status: PaymentStatus.COMPLETED,
      processedAt: new Date()
    };

    if (paymentDto.reference) paymentData.reference = paymentDto.reference;
    if (paymentDto.notes) paymentData.notes = paymentDto.notes;
    if (userId) paymentData.processedBy = userId;

    // Use insert to force INSERT operation
    const insertResult = await this.paymentRepository
      .createQueryBuilder()
      .insert()
      .into(Payment)
      .values(paymentData)
      .returning('*')
      .execute();

    const savedPayment = insertResult.raw[0] as Payment;

    // Update sale paid amount directly to avoid cascade issues
    const newPaidAmount = Number(sale.paidAmount || 0) + Number(paymentDto.amount);
    const updateData: any = {
      paidAmount: newPaidAmount
    };

    // Update credit amount if it's a credit sale
    if (sale.type === SaleType.CREDIT) {
      updateData.creditAmount = Math.max(0, Number(sale.total) - newPaidAmount);
    }

    await this.saleRepository.update(saleId, updateData);

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

  private async getProductInfo(productId: string, tenantId: string, variantId?: string): Promise<any> {
    try {
      const product = await this.productsService.findOne(productId, tenantId);

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

      // Calculate the actual price for the variant
      let costPrice = 0;
      if (product.basePrice !== undefined && product.basePrice !== null) {
        costPrice = Number(product.basePrice);

        // Add priceDelta if this is a variant
        if (variant && variant.priceDelta !== undefined && variant.priceDelta !== null) {
          costPrice += Number(variant.priceDelta);
        }
      }

      // Validate that costPrice is a valid number
      if (isNaN(costPrice) || !isFinite(costPrice)) {
        costPrice = 0;
      }

      // Get actual stock from inventory service
      const stockData = await this.inventoryService.getStock(productId, variantId);
      const currentStock = Number(stockData?.quantity || 0);

      return {
        id: productId,
        name: product.name,
        sku: variant?.sku || product.sku,
        variantName: variant?.name || null,
        costPrice: costPrice,
        stock: currentStock,
        taxRate: 19, // Colombian IVA - this should come from product config
        taxCode: 'IVA',
        saleType: product.saleType,
        pricePerGram: product.pricePerGram
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
        stock: 0,
        taxRate: 19,
        taxCode: 'IVA',
        saleType: 'UNIT',
        pricePerGram: null
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
}
