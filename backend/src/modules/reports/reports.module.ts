import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovement]),
    SalesModule,
    InventoryModule,
    CashRegisterModule
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

