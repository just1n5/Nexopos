@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryStock, InventoryMovement])
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService]
})
export class InventoryModule {}
