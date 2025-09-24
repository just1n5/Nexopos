import { Module } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';
import { SalesModule } from '../sales/sales.module';
import { InventoryModule } from '../inventory/inventory.module';
import { InvoiceDianModule } from '../invoice-dian/invoice-dian.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { CustomersModule } from '../customers/customers.module';

/**
 * Integration Module
 * 
 * Este módulo centraliza las operaciones que requieren coordinación
 * entre múltiples módulos del sistema, evitando dependencias circulares
 * y manteniendo la arquitectura de monolito modular.
 */
@Module({
  imports: [
    SalesModule,
    InventoryModule,
    InvoiceDianModule,
    CashRegisterModule,
    CustomersModule,
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
