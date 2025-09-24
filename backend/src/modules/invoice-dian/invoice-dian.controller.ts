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
import { InvoiceDianService } from './invoice-dian.service';
import {
  CreateInvoiceDto,
  CreateResolutionDto,
  CancelInvoiceDto,
  ResendInvoiceDto,
  TestDianConnectionDto
} from './dto/invoice-dian.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Invoice DIAN')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoice-dian')
export class InvoiceDianController {
  constructor(private readonly invoiceDianService: InvoiceDianService) {}

  @Post()
  @ApiOperation({ summary: 'Generate DIAN electronic invoice' })
  @ApiResponse({ status: 201, description: 'Invoice generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or no active resolution' })
  @ApiResponse({ status: 409, description: 'Invoice already exists for sale' })
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoiceDianService.createInvoice(createInvoiceDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices with optional filters' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['POS', 'INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE'] })
  async findAll(@Query() filters: any) {
    return this.invoiceDianService.findAll(filters);
  }

  @Get('resolutions')
  @ApiOperation({ summary: 'Get all DIAN resolutions' })
  async getResolutions() {
    return this.invoiceDianService.getResolutions();
  }

  @Post('resolutions')
  @ApiOperation({ summary: 'Create a new DIAN resolution' })
  @ApiResponse({ status: 201, description: 'Resolution created successfully' })
  @ApiResponse({ status: 409, description: 'Resolution with prefix already exists' })
  async createResolution(@Body() createResolutionDto: CreateResolutionDto) {
    return this.invoiceDianService.createResolution(createResolutionDto);
  }

  @Get('test-connection')
  @ApiOperation({ summary: 'Test DIAN API connection' })
  async testConnection() {
    return this.invoiceDianService.testConnection();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceDianService.findOne(id);
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 409, description: 'Invoice cannot be cancelled' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelInvoiceDto,
    @Request() req
  ) {
    return this.invoiceDianService.cancelInvoice(id, cancelDto, req.user.userId);
  }

  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend invoice to customer' })
  @ApiResponse({ status: 200, description: 'Invoice resent successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async resend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resendDto: ResendInvoiceDto
  ) {
    // Implementation for resending invoice via email
    return {
      message: 'Invoice resend functionality - To be implemented',
      invoiceId: id,
      email: resendDto.email
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: 200, description: 'Invoice PDF' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async download(@Param('id', ParseUUIDPipe) id: string) {
    // Implementation for PDF generation
    return {
      message: 'Invoice PDF download - To be implemented',
      invoiceId: id
    };
  }

  @Get(':id/xml')
  @ApiOperation({ summary: 'Get invoice XML' })
  @ApiResponse({ status: 200, description: 'Invoice XML content' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getXml(@Param('id', ParseUUIDPipe) id: string) {
    const invoice = await this.invoiceDianService.findOne(id);
    return {
      xml: invoice.xmlContent,
      signedXml: invoice.signedXml
    };
  }
}
