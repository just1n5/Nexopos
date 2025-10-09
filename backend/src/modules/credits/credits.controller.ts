import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { CreateCreditPaymentDto } from './dto/create-credit-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get()
  @ApiOperation({ summary: 'List credit sales with optional filters' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'paid', 'overdue'] })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  findAll(
    @CurrentUser() user: User,
    @Query('customerId') customerId?: string,
    @Query('status') status?: 'pending' | 'paid' | 'overdue',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.creditsService.findAll(user.tenantId, {
      customerId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get credit summary' })
  getSummary(@CurrentUser() user: User) {
    return this.creditsService.getSummary(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit sale details' })
  findOne(@Param('id') id: string) {
    return this.creditsService.findOne(id);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get payment history for a credit sale' })
  getPayments(@Param('id') id: string) {
    return this.creditsService.getPayments(id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Register a payment for a credit sale' })
  addPayment(
    @Param('id') id: string,
    @Body() dto: CreateCreditPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.creditsService.addPayment(id, dto, user.id, user.tenantId);
  }

  @Post(':id/reminder')
  @ApiOperation({ summary: 'Send a payment reminder' })
  sendReminder(
    @Param('id') id: string,
    @Body('method') method: 'whatsapp' | 'sms' | 'email' = 'whatsapp',
  ) {
    return this.creditsService.sendReminder(id, method);
  }
}
