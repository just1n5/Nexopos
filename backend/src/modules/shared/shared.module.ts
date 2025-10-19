import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  exports: [InventoryModule],
})
export class SharedModule {}
