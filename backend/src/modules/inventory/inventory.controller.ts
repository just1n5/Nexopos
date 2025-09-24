import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock/:productId')
  @ApiOperation({ summary: 'Get stock for a product' })
  @ApiQuery({ name: 'variantId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getStock(
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
    @Query('warehouseId') warehouseId?: string
  ) {
    return this.inventoryService.getStock(productId, variantId, warehouseId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getLowStock(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getLowStockProducts(warehouseId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get products expiring soon' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getExpiring(
    @Query('daysAhead') daysAhead?: number,
    @Query('warehouseId') warehouseId?: string
  ) {
    return this.inventoryService.getExpiringProducts(daysAhead || 30, warehouseId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get stock movements' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'variantId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'movementType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getMovements(@Query() filters: any) {
    return this.inventoryService.getStockMovements(filters);
  }

  @Get('valuation')
  @ApiOperation({ summary: 'Get stock valuation' })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getValuation(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getStockValuation(warehouseId);
  }
}
