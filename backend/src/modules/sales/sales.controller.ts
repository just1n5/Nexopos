import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, QuickSaleDto, CalculateSaleDto } from './dto/create-sale.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createSaleDto: CreateSaleDto, @CurrentUser() user: User) {
    return this.salesService.create(createSaleDto, user.id, user.tenantId);
  }

  @Post('quick')
  @ApiOperation({ summary: 'Create a quick sale (simplified flow)' })
  @ApiResponse({ status: 201, description: 'Quick sale created successfully' })
  async quickSale(@Body() quickSaleDto: QuickSaleDto, @CurrentUser() user: User) {
    return this.salesService.quickSale(quickSaleDto, user.id, user.tenantId);
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate sale totals without creating a sale' })
  @ApiResponse({ status: 200, description: 'Sale totals calculated' })
  async calculateTotals(@Body() calculateDto: CalculateSaleDto, @CurrentUser() user: User) {
    const items = calculateDto.items;
    const totals = await this.salesService.calculateTotals(items, user.tenantId);

    // Apply overall discount if provided
    let finalTotal = totals.total;
    let finalDiscountAmount = totals.discountAmount;

    if (calculateDto.discountPercent > 0) {
      finalDiscountAmount += totals.subtotal * (calculateDto.discountPercent / 100);
      finalTotal = totals.subtotal - finalDiscountAmount + totals.taxAmount;
    } else if (calculateDto.discountAmount > 0) {
      finalDiscountAmount += calculateDto.discountAmount;
      finalTotal = totals.subtotal - finalDiscountAmount + totals.taxAmount;
    }

    return {
      subtotal: totals.subtotal,
      discountAmount: finalDiscountAmount,
      taxAmount: totals.taxAmount,
      total: finalTotal,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales with optional filters' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'] })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async findAll(@Query() filters: any) {
    return this.salesService.findAll(filters);
  }

  @Get('daily-summary')
  @ApiOperation({ summary: 'Get daily sales summary' })
  @ApiQuery({ name: 'date', required: false, type: Date })
  async getDailySummary(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.salesService.getDailySummary(targetDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale found' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel a sale' })
  @ApiResponse({ status: 200, description: 'Sale cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @ApiResponse({ status: 409, description: 'Sale cannot be cancelled' })
  async cancelSale(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.salesService.cancelSale(id, req.user.id);
  }

  // Reports endpoints
  @Get('reports/top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getTopProducts(@Query() filters: any) {
    // Implementation for top products report
    return { message: 'Top products report - To be implemented' };
  }

  @Get('reports/sales-by-hour')
  @ApiOperation({ summary: 'Get sales by hour for a specific date' })
  @ApiQuery({ name: 'date', required: false, type: Date })
  async getSalesByHour(@Query('date') date?: string) {
    // Implementation for sales by hour report
    return { message: 'Sales by hour report - To be implemented' };
  }

  @Get('reports/payment-methods')
  @ApiOperation({ summary: 'Get payment methods summary' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getPaymentMethodsSummary(@Query() filters: any) {
    // Implementation for payment methods report
    return { message: 'Payment methods report - To be implemented' };
  }
}
