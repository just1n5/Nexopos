import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Permissions, Permission } from '../users/decorators/permissions.decorator';
import { MovementType } from './entities/inventory-movement.entity';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock/:productId')
  @Permissions(Permission.INVENTORY_READ)
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
  @Permissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getLowStock(@Query('warehouseId') warehouseId?: string, @Request() req) {
    return this.inventoryService.getLowStockProducts(req.user.tenantId, warehouseId);
  }

  @Get('expiring')
  @Permissions(Permission.INVENTORY_READ)
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
  @Permissions(Permission.INVENTORY_READ)
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
  @Permissions(Permission.REPORTS_INVENTORY)
  @ApiOperation({ summary: 'Get stock valuation' })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getValuation(@Query('warehouseId') warehouseId?: string, @Request() req) {
    return this.inventoryService.getStockValuation(req.user.tenantId, warehouseId);
  }

  @Post('adjust-stock')
  @Permissions(Permission.INVENTORY_ADJUST)
  @ApiOperation({ summary: 'Manually adjust stock for a product' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId', 'quantity', 'movementType'],
      properties: {
        productId: { type: 'string', format: 'uuid' },
        quantity: { type: 'number', description: 'Positive for addition, negative for reduction. For weight-based products, this value must be in GRAMS.' },
        movementType: { 
          type: 'string', 
          enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'DAMAGE', 'PRODUCTION'],
          description: 'Type of stock movement'
        },
        variantId: { type: 'string', format: 'uuid' },
        warehouseId: { type: 'string', format: 'uuid' },
        unitCost: { type: 'number' },
        notes: { type: 'string' },
        reason: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or insufficient stock' })
  async adjustStock(
    @Body() adjustStockDto: {
      productId: string;
      quantity: number;
      movementType: MovementType;
      variantId?: string;
      warehouseId?: string;
      unitCost?: number;
      notes?: string;
      reason?: string;
    },
    @Request() req
  ) {
    return this.inventoryService.adjustStock(
      adjustStockDto.productId,
      adjustStockDto.quantity,
      adjustStockDto.movementType,
      req.user.id,
      req.user.tenantId,
      {
        variantId: adjustStockDto.variantId,
        warehouseId: adjustStockDto.warehouseId,
        unitCost: adjustStockDto.unitCost,
        notes: adjustStockDto.notes,
        reason: adjustStockDto.reason
      }
    );
  }

  @Post('stock-count')
  @Permissions(Permission.INVENTORY_ADJUST)
  @ApiOperation({ summary: 'Perform stock count and create adjustment if needed' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId', 'actualQuantity'],
      properties: {
        productId: { type: 'string', format: 'uuid' },
        actualQuantity: { type: 'number', description: 'The actual counted quantity' },
        variantId: { type: 'string', format: 'uuid' },
        warehouseId: { type: 'string', format: 'uuid' },
        batchNumber: { type: 'string' },
        notes: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Stock count performed successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async performStockCount(
    @Body() stockCountDto: {
      productId: string;
      actualQuantity: number;
      variantId?: string;
      warehouseId?: string;
      batchNumber?: string;
      notes?: string;
    },
    @Request() req
  ) {
    const movement = await this.inventoryService.performStockCount(
      stockCountDto.productId,
      stockCountDto.actualQuantity,
      req.user.id,
      req.user.tenantId,
      {
        variantId: stockCountDto.variantId,
        warehouseId: stockCountDto.warehouseId,
        batchNumber: stockCountDto.batchNumber,
        notes: stockCountDto.notes
      }
    );

    return {
      success: true,
      message: movement ? 'Stock adjusted based on count' : 'Stock count matches, no adjustment needed',
      movement
    };
  }
}
