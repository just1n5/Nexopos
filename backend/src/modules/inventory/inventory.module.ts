import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryStock } from './entities/inventory-stock.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { StockReservation } from './entities/stock-reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryStock, InventoryMovement, StockReservation])
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService]
})
export class InventoryModule {}
