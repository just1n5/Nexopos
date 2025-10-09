import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StreamableFile } from '@nestjs/common';
import { Buffer } from 'buffer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Permissions, Permission } from '../users/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Permissions(Permission.REPORTS_SALES)
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesReport(this.toFilters(startDate, endDate));
  }

  @Get('products')
  @Permissions(Permission.REPORTS_INVENTORY)
  @ApiOperation({ summary: 'Get products report' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getProductsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getProductsReport(this.toFilters(startDate, endDate));
  }

  @Get('customers')
  @Permissions(Permission.REPORTS_FINANCIAL)
  @ApiOperation({ summary: 'Get customers report' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getCustomersReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCustomersReport(this.toFilters(startDate, endDate));
  }

  @Get('inventory')
  @Permissions(Permission.REPORTS_INVENTORY)
  @ApiOperation({ summary: 'Get inventory report' })
  getInventoryReport(@CurrentUser() user: User) {
    return this.reportsService.getInventoryReport(user.tenantId);
  }

  @Get('cash-register')
  @Permissions(Permission.REPORTS_FINANCIAL)
  @ApiOperation({ summary: 'Get cash register arqueos report' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getCashRegisterReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCashRegisterReport(this.toFilters(startDate, endDate));
  }

  @Get('inventory-movements')
  @ApiOperation({ summary: 'Get inventory movements report' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getInventoryMovementsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getInventoryMovementsReport(this.toFilters(startDate, endDate));
  }

  @Get(':type/download')
  @ApiOperation({ summary: 'Download report as CSV' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async downloadReport(
    @Param('type') type: 'sales' | 'products' | 'customers' | 'inventory',
    @CurrentUser() user: User,
    @Query('format') format: 'csv' = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const file = await this.reportsService.generateReportFile(type, format, this.toFilters(startDate, endDate), user.tenantId);
    const buffer = Buffer.from(file.content, 'utf8');
    return new StreamableFile(buffer, {
      type: file.mimeType,
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  private toFilters(startDate?: string, endDate?: string) {
    return {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
  }
}

