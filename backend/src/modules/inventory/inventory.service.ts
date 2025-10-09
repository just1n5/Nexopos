import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { InventoryStock, StockStatus } from './entities/inventory-stock.entity';
import { InventoryMovement, MovementType } from './entities/inventory-movement.entity';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryStock)
    private stockRepository: Repository<InventoryStock>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    private dataSource: DataSource,
  ) {}

  async getStock(productId: string, variantId?: string, warehouseId?: string): Promise<InventoryStock> {
    const where: any = { productId };
    if (variantId) where.productVariantId = variantId;
    if (warehouseId) where.warehouseId = warehouseId;

    const stock = await this.stockRepository.findOne({ where });
    
    if (!stock) {
      // Create initial stock record
      return this.stockRepository.create({
        productId,
        productVariantId: variantId,
        warehouseId,
        quantity: 0,
        availableQuantity: 0,
        status: StockStatus.OUT_OF_STOCK
      });
    }

    return stock;
  }

  async adjustStock(
    productId: string,
    quantity: number,
    movementType: MovementType,
    userId: string,
    metadata?: {
      variantId?: string;
      warehouseId?: string;
      batchNumber?: string;
      expiryDate?: Date;
      unitCost?: number;
      referenceType?: string;
      referenceId?: string;
      referenceNumber?: string;
      notes?: string;
      reason?: string;
    }
  ): Promise<InventoryMovement> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get or create stock record
      let stock = await this.getStock(productId, metadata?.variantId, metadata?.warehouseId);
      this.logger.log(`DEBUG: adjustStock - Initial stock state for product ${productId}: ${JSON.stringify(stock)}`);
      
      if (!stock.id) {
        this.logger.log(`DEBUG: adjustStock - Creating new stock record for product ${productId}`);
        stock = await queryRunner.manager.save(InventoryStock, stock);
        this.logger.log(`DEBUG: adjustStock - New stock record created: ${JSON.stringify(stock)}`);
      } else {
        stock = await queryRunner.manager.findOne(InventoryStock, { where: { id: stock.id } });
        this.logger.log(`DEBUG: adjustStock - Found existing stock record: ${JSON.stringify(stock)}`);
      }

      // Ensure all values are numbers
      const quantityBefore = Number(stock.quantity) || 0;
      const quantityChange = Number(quantity) || 0;
      const quantityAfter = quantityBefore + quantityChange;

      // Validate sufficient stock for outgoing movements
      if (quantityChange < 0 && quantityAfter < 0) {
        throw new BadRequestException(`Insufficient stock. Available: ${quantityBefore}, Requested: ${Math.abs(quantityChange)}`);
      }

      // Create movement record
      const movement = queryRunner.manager.create(InventoryMovement, {
        productId,
        productVariantId: metadata?.variantId,
        movementType,
        quantity: quantityChange,
        quantityBefore,
        quantityAfter,
        unitCost: metadata?.unitCost,
        totalCost: metadata?.unitCost ? metadata.unitCost * Math.abs(quantityChange) : null,
        referenceType: metadata?.referenceType,
        referenceId: metadata?.referenceId,
        referenceNumber: metadata?.referenceNumber,
        batchNumber: metadata?.batchNumber,
        expiryDate: metadata?.expiryDate,
        warehouseId: metadata?.warehouseId,
        notes: metadata?.notes,
        reason: metadata?.reason,
        userId
      });

      const savedMovement = await queryRunner.manager.save(movement);

      // Update stock quantity
      stock.quantity = quantityAfter;
      stock.availableQuantity = quantityAfter - (Number(stock.reservedQuantity) || 0);
      stock.lastMovementId = savedMovement.id;
      stock.lastMovementDate = new Date();

      // Update status
      const minStock = Number(stock.minStockLevel) || 0;
      if (stock.quantity <= 0) {
        stock.status = StockStatus.OUT_OF_STOCK;
      } else if (stock.quantity <= minStock) {
        stock.status = StockStatus.LOW_STOCK;
      } else {
        stock.status = StockStatus.IN_STOCK;
      }

      // Update average cost for incoming movements
      if (quantityChange > 0 && metadata?.unitCost) {
        // Use quantityBefore for correct calculation
        const currentAverageCost = Number(stock.averageCost) || 0;
        const totalCurrentValue = quantityBefore * currentAverageCost;
        const totalNewValue = Math.abs(quantityChange) * metadata.unitCost;
        // quantityAfter is the new total quantity
        stock.averageCost = quantityAfter > 0 ? (totalCurrentValue + totalNewValue) / quantityAfter : metadata.unitCost;
        stock.lastCost = metadata.unitCost;
      }

      stock.totalValue = stock.quantity * (Number(stock.averageCost) || 0);

      this.logger.log(`DEBUG: adjustStock - Stock state before final save: ${JSON.stringify(stock)}`);
      await queryRunner.manager.save(stock);
      this.logger.log(`DEBUG: adjustStock - Stock saved. Committing transaction.`);
      await queryRunner.commitTransaction();
      this.logger.log(`DEBUG: adjustStock - Transaction committed successfully.`);

      this.logger.log(`Stock adjusted for product ${productId}: ${quantityBefore} -> ${quantityAfter}`);

      // Check if alert needed
      if (stock.isLowStock) {
        this.logger.warn(`LOW STOCK ALERT: Product ${productId} has only ${stock.quantity} units`);
      }

      return savedMovement;
    } catch (error) {
      this.logger.error(`DEBUG: adjustStock - Transaction rolled back due to error: ${error.message}`, error.stack);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processStockForSale(saleItems: any[], userId: string): Promise<void> {
    for (const item of saleItems) {
      await this.adjustStock(
        item.productId,
        -item.quantity,
        MovementType.SALE,
        userId,
        {
          variantId: item.productVariantId,
          referenceType: 'sale',
          referenceId: item.saleId,
          referenceNumber: item.saleNumber,
          unitCost: item.costPrice
        }
      );
    }
  }

  async getLowStockProducts(tenantId: string, warehouseId?: string): Promise<InventoryStock[]> {
    // Get all product IDs for this tenant
    const productIds = await this.dataSource.query(
      'SELECT id FROM products WHERE "tenantId" = $1',
      [tenantId]
    );

    const productIdList = productIds.map((p: any) => p.id);

    if (productIdList.length === 0) {
      return [];
    }

    const query = this.stockRepository.createQueryBuilder('stock')
      .where('stock.status IN (:...statuses)', {
        statuses: [StockStatus.LOW_STOCK, StockStatus.OUT_OF_STOCK]
      })
      .andWhere('stock.productId IN (:...productIds)', { productIds: productIdList });

    if (warehouseId) {
      query.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }

    return query.getMany();
  }

  async getExpiringProducts(daysAhead = 30, warehouseId?: string): Promise<InventoryStock[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const query = this.stockRepository.createQueryBuilder('stock')
      .where('stock.expiryDate <= :expiryDate', { expiryDate })
      .andWhere('stock.quantity > 0');

    if (warehouseId) {
      query.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }

    return query.orderBy('stock.expiryDate', 'ASC').getMany();
  }

  async getStockMovements(filters: {
    productId?: string;
    variantId?: string;
    warehouseId?: string;
    movementType?: MovementType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<InventoryMovement[]> {
    const query = this.movementRepository.createQueryBuilder('movement');

    if (filters.productId) {
      query.andWhere('movement.productId = :productId', { productId: filters.productId });
    }

    if (filters.variantId) {
      query.andWhere('movement.productVariantId = :variantId', { variantId: filters.variantId });
    }

    if (filters.warehouseId) {
      query.andWhere('movement.warehouseId = :warehouseId', { warehouseId: filters.warehouseId });
    }

    if (filters.movementType) {
      query.andWhere('movement.movementType = :type', { type: filters.movementType });
    }

    if (filters.startDate) {
      query.andWhere('movement.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('movement.createdAt <= :endDate', { endDate: filters.endDate });
    }

    return query.orderBy('movement.createdAt', 'DESC').getMany();
  }

  async getStockValuation(tenantId: string, warehouseId?: string): Promise<any> {
    // Get all product IDs for this tenant
    const productIds = await this.dataSource.query(
      'SELECT id FROM products WHERE "tenantId" = $1',
      [tenantId]
    );

    const productIdList = productIds.map((p: any) => p.id);

    if (productIdList.length === 0) {
      return {
        totalValue: 0,
        totalItems: 0,
        totalProducts: 0,
        byStatus: {
          inStock: 0,
          lowStock: 0,
          outOfStock: 0
        }
      };
    }

    const query = this.stockRepository.createQueryBuilder('stock')
      .where('stock.productId IN (:...productIds)', { productIds: productIdList });

    if (warehouseId) {
      query.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }

    const stocks = await query.getMany();

    const totalValue = stocks.reduce((sum, stock) => sum + Number(stock.totalValue), 0);
    const totalItems = stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0);

    return {
      totalValue,
      totalItems,
      totalProducts: stocks.length,
      byStatus: {
        inStock: stocks.filter(s => s.status === StockStatus.IN_STOCK).length,
        lowStock: stocks.filter(s => s.status === StockStatus.LOW_STOCK).length,
        outOfStock: stocks.filter(s => s.status === StockStatus.OUT_OF_STOCK).length
      }
    };
  }

  async performStockCount(
    productId: string,
    actualQuantity: number,
    userId: string,
    metadata?: {
      variantId?: string;
      warehouseId?: string;
      batchNumber?: string;
      notes?: string;
    }
  ): Promise<InventoryMovement> {
    const stock = await this.getStock(productId, metadata?.variantId, metadata?.warehouseId);
    
    if (!stock.id) {
      throw new NotFoundException(`Stock record not found for product ${productId}`);
    }

    const currentQuantity = Number(stock.quantity) || 0;
    const difference = Number(actualQuantity) - currentQuantity;
    
    if (difference === 0) {
      this.logger.log(`Stock count matches for product ${productId}`);
      return null;
    }

    // Create adjustment movement
    const movement = await this.adjustStock(
      productId,
      difference,
      MovementType.ADJUSTMENT,
      userId,
      {
        ...metadata,
        reason: 'Stock count adjustment',
        notes: `Stock count: Expected ${currentQuantity}, Actual ${actualQuantity}, Difference ${difference}. ${metadata?.notes || ''}`
      }
    );

    // Update last count info
    stock.lastCountDate = new Date();
    stock.lastCountQuantity = actualQuantity;
    await this.stockRepository.save(stock);

    return movement;
  }
}
