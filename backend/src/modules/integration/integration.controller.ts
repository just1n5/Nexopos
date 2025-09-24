import { 
  Controller, 
  Post, 
  Param, 
  Body, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationService } from './integration.service';

/**
 * Integration Controller
 * 
 * Endpoints para operaciones que requieren coordinación entre múltiples módulos
 */
@ApiTags('Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  /**
   * Completa una venta y ejecuta todas las integraciones
   */
  @Post('sales/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Complete a sale',
    description: 'Completes a sale and triggers all necessary integrations (inventory, invoice, cash register)' 
  })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({ status: 200, description: 'Sale completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid sale or already completed' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async completeSale(@Param('id') saleId: string) {
    return this.integrationService.completeSale(saleId);
  }

  /**
   * Cancela una venta y revierte todas las operaciones
   */
  @Post('sales/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancel a sale',
    description: 'Cancels a sale and reverts all related operations (inventory, invoice, cash register)' 
  })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for cancellation',
          example: 'Customer request'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Sale cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid sale or already cancelled' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async cancelSale(
    @Param('id') saleId: string,
    @Body('reason') reason: string,
    @Request() req
  ) {
    if (!reason) {
      throw new BadRequestException('Cancellation reason is required');
    }
    return this.integrationService.cancelSale(saleId, reason, req.user.id);
  }

  /**
   * Procesa un pago parcial para una venta a crédito
   */
  @Post('sales/:id/partial-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Process partial payment',
    description: 'Process a partial payment for a credit sale' 
  })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount', 'paymentMethod'],
      properties: {
        amount: {
          type: 'number',
          description: 'Payment amount',
          example: 50000
        },
        paymentMethod: {
          type: 'string',
          description: 'Payment method',
          enum: ['cash', 'card', 'nequi', 'daviplata', 'bank_transfer'],
          example: 'cash'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async processPartialPayment(
    @Param('id') saleId: string,
    @Body() paymentData: { amount: number; paymentMethod: string },
    @Request() req
  ) {
    const { amount, paymentMethod } = paymentData;
    
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }
    
    if (!paymentMethod) {
      throw new BadRequestException('Payment method is required');
    }

    return this.integrationService.processPartialPayment(
      saleId,
      amount,
      paymentMethod,
      req.user.id
    );
  }

  /**
   * Realiza el cierre diario
   */
  @Post('daily-close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Perform daily close',
    description: 'Performs the daily closing process including cash register close and pending sales processing' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily close completed successfully',
    schema: {
      type: 'object',
      properties: {
        zReport: {
          type: 'object',
          description: 'Z Report summary'
        },
        closeResult: {
          type: 'object',
          description: 'Cash register close result'
        },
        pendingSalesProcessed: {
          type: 'number',
          description: 'Number of pending sales processed'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'No active cash register session' })
  async performDailyClose(@Request() req) {
    return this.integrationService.performDailyClose(req.user.id);
  }
}
