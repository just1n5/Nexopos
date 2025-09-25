export {
  salesService,
  mapFrontPaymentMethodToBackend,
  type CreateSaleDto,
  type QuickSaleDto,
  type CalculateSaleDto,
  type CalculateSaleResult,
  type BackendPaymentMethod
} from './salesService'
export { productsService } from './productsService'
export { customersService, type CreateCustomerDto } from './customersService'
export { categoriesService, type Category, type CreateCategoryDto } from './categoriesService'
export { 
  inventoryService,
  MovementType,
  StockStatus,
  type InventoryStock,
  type InventoryMovement,
  type AdjustStockDto,
  type StockCountDto,
  type StockValuation
} from './inventoryService'
