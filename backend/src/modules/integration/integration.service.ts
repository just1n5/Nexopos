import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { InvoiceDianService } from '../invoice-dian/invoice-dian.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { CustomersService } from '../customers/customers.service';
import { Sale, SaleStatus, SaleType } from '../sales/entities/sale.entity';
import { MovementType } from '../inventory/entities/inventory-movement.entity';

/**
 * Integration Service
 * Coordina las operaciones entre módulos para mantener la consistencia
 * y evitar dependencias circulares
 */
@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly salesService: SalesService,
    private readonly inventoryService: InventoryService,
    private readonly invoiceDianService: InvoiceDianService,
    private readonly cashRegisterService: CashRegisterService,
    private readonly customersService: CustomersService,
  ) {}

  /**
   * Completa una venta y ejecuta todas las integraciones necesarias
   * - Actualiza el inventario
   * - Genera factura DIAN si es requerida
   * - Registra en la caja
   * - Actualiza el crédito del cliente si aplica
   */
  async completeSale(saleId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener la venta
      const sale = await this.salesService.findOne(saleId);
      
      if (!sale) {
        throw new BadRequestException(`Sale ${saleId} not found`);
      }

      if (sale.status === SaleStatus.COMPLETED) {
        throw new BadRequestException(`Sale ${saleId} is already completed`);
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException(`Cannot complete cancelled sale ${saleId}`);
      }

      this.logger.log(`Completing sale ${saleId}`);

      // 2. Actualizar estado de la venta
      sale.status = SaleStatus.COMPLETED;
      sale.completedAt = new Date();
      await queryRunner.manager.save(sale);

      // 3. Actualizar inventario
      this.logger.log(`Updating inventory for sale ${saleId}`);
      for (const item of sale.items) {
        await this.inventoryService.adjustStock(
          item.productId,
          -item.quantity,
          MovementType.SALE,
          sale.userId,
          {
            variantId: item.productVariantId,
            referenceType: 'sale',
            referenceId: sale.id,
            referenceNumber: sale.saleNumber,
            unitCost: item.costPrice,
            notes: `Sale ${sale.saleNumber}`
          }
        );
      }

      // 4. Generar factura DIAN si es requerida
      if (sale.requiresInvoice) {
        this.logger.log(`Generating DIAN invoice for sale ${saleId}`);
        const invoice = await this.invoiceDianService.generateFromSale(sale);
        sale.invoiceId = invoice.id;
        await queryRunner.manager.save(sale);
      }

      // 5. Registrar en caja
      const cashRegister = await this.cashRegisterService.getCurrentSession(sale.userId);
      if (cashRegister) {
        this.logger.log(`Registering payment in cash register for sale ${saleId}`);
        await this.cashRegisterService.registerSalePayment(
          cashRegister.id,
          sale
        );
      }

      // 6. Si es venta a crédito, actualizar el saldo del cliente
      if (sale.type === SaleType.CREDIT && sale.customerId) {
        this.logger.log(`Updating customer credit for sale ${saleId}`);
        await this.customersService.addCredit(
          sale.customerId,
          sale.creditAmount,
          sale.id,
          sale.creditDueDate
        );
      }

      await queryRunner.commitTransaction();
      
      this.logger.log(`Sale ${saleId} completed successfully`);
      return sale;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error completing sale ${saleId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancela una venta y revierte todas las operaciones
   */
  async cancelSale(saleId: string, reason: string, userId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener la venta
      const sale = await this.salesService.findOne(saleId);
      
      if (!sale) {
        throw new BadRequestException(`Sale ${saleId} not found`);
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException(`Sale ${saleId} is already cancelled`);
      }

      this.logger.log(`Cancelling sale ${saleId}`);

      // 2. Si la venta estaba completada, revertir operaciones
      if (sale.status === SaleStatus.COMPLETED) {
        
        // Revertir inventario
        this.logger.log(`Reverting inventory for sale ${saleId}`);
        for (const item of sale.items) {
          await this.inventoryService.adjustStock(
            item.productId,
            item.quantity, // Devolver al inventario
            MovementType.RETURN_CUSTOMER,
            userId,
            {
              variantId: item.productVariantId,
              referenceType: 'sale_cancellation',
              referenceId: sale.id,
              referenceNumber: sale.saleNumber,
              unitCost: item.costPrice,
              notes: `Cancellation of sale ${sale.saleNumber}: ${reason}`
            }
          );
        }

        // Cancelar factura DIAN si existe
        if (sale.invoiceId) {
          this.logger.log(`Cancelling DIAN invoice for sale ${saleId}`);
          await this.invoiceDianService.cancelInvoice(
            sale.invoiceId,
            { reason },
            userId
          );
        }

        // Revertir movimiento en caja
        const cashRegister = await this.cashRegisterService.getCurrentSession(sale.userId);
        if (cashRegister) {
          this.logger.log(`Reverting cash register payment for sale ${saleId}`);
          await this.cashRegisterService.revertSalePayment(
            cashRegister.id,
            sale,
            reason
          );
        }

        // Si era venta a crédito, eliminar el crédito del cliente
        if (sale.type === SaleType.CREDIT && sale.customerId) {
          this.logger.log(`Reverting customer credit for sale ${saleId}`);
          await this.customersService.removeCredit(
            sale.customerId,
            sale.id
          );
        }
      }

      // 3. Actualizar estado de la venta
      sale.status = SaleStatus.CANCELLED;
      sale.cancelledAt = new Date();
      sale.cancellationReason = reason;
      sale.cancelledBy = userId;
      await queryRunner.manager.save(sale);

      await queryRunner.commitTransaction();
      
      this.logger.log(`Sale ${saleId} cancelled successfully`);
      return sale;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error cancelling sale ${saleId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Procesa un pago parcial para una venta a crédito
   */
  async processPartialPayment(
    saleId: string,
    amount: number,
    paymentMethod: string,
    userId: string
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await this.salesService.findOne(saleId);
      
      if (!sale || sale.type !== SaleType.CREDIT) {
        throw new BadRequestException(`Credit sale ${saleId} not found`);
      }

      // 1. Registrar el pago
      const payment = await this.salesService.addPayment(saleId, {
        amount,
        method: paymentMethod,
        reference: '',
        notes: 'Partial payment'
      });

      // 2. Actualizar el crédito del cliente
      if (sale.customerId) {
        await this.customersService.reduceCredit(
          sale.customerId,
          amount,
          payment[0].id
        );
      }

      // 3. Registrar en caja si está abierta
      const cashRegister = await this.cashRegisterService.getCurrentSession(userId);
      if (cashRegister) {
        await this.cashRegisterService.registerPayment(
          cashRegister.id,
          {
            amount,
            method: paymentMethod,
            reference: `Credit payment for sale ${sale.saleNumber}`,
            type: 'credit_payment'
          }
        );
      }

      // 4. Si el crédito está completamente pagado, actualizar estado
      const remainingCredit = sale.creditAmount - sale.paidAmount - amount;
      if (remainingCredit <= 0) {
        sale.creditPaidDate = new Date();
      }

      await queryRunner.commitTransaction();
      
      return {
        payment,
        remainingCredit,
        isFullyPaid: remainingCredit <= 0
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Realiza el cierre de caja del día
   */
  async performDailyClose(userId: string): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cerrar la caja actual
      const cashRegister = await this.cashRegisterService.getCurrentSession(userId);
      if (!cashRegister) {
        throw new BadRequestException('No active cash register session');
      }

      // 2. Generar reporte Z (resumen del día)
      const zReport = await this.cashRegisterService.generateZReport(cashRegister.id);

      // 3. Cerrar todas las ventas pendientes
      const pendingSales = await this.salesService.findPending();
      for (const sale of pendingSales) {
        await this.completeSale(sale.id);
      }

      // 4. Cerrar la sesión de caja
      const closeResult = await this.cashRegisterService.closeSession(
        cashRegister.id,
        zReport.physicalCash,
        userId
      );

      await queryRunner.commitTransaction();

      return {
        zReport,
        closeResult,
        pendingSalesProcessed: pendingSales.length
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
