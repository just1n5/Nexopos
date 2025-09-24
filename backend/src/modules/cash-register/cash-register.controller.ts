import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateMovementDto,
  CreateExpenseDto,
  CashAdjustmentDto
} from './dto/cash-register.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cash Register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('open')
  @ApiOperation({ summary: 'Open a new cash register session' })
  @ApiResponse({ status: 201, description: 'Cash register opened successfully' })
  @ApiResponse({ status: 409, description: 'Cash register already open' })
  async open(@Body() openDto: OpenCashRegisterDto, @Request() req) {
    return this.cashRegisterService.openCashRegister(openDto, req.user.userId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a cash register session' })
  @ApiResponse({ status: 200, description: 'Cash register closed successfully' })
  @ApiResponse({ status: 404, description: 'Cash register not found' })
  @ApiResponse({ status: 409, description: 'Cash register is not open' })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() closeDto: CloseCashRegisterDto,
    @Request() req
  ) {
    return this.cashRegisterService.closeCashRegister(id, closeDto, req.user.userId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current open cash register session' })
  @ApiResponse({ status: 200, description: 'Current cash register session' })
  @ApiResponse({ status: 404, description: 'No open cash register found' })
  async getCurrent(@Request() req) {
    const session = await this.cashRegisterService.getCurrentSession(req.user.userId);
    if (!session) {
      return { message: 'No open cash register session' };
    }
    return session;
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get cash register summary' })
  @ApiQuery({ name: 'cashRegisterId', required: false })
  async getSummary(
    @Query('cashRegisterId') cashRegisterId?: string,
    @Request() req?
  ) {
    return this.cashRegisterService.getSummary(cashRegisterId, req?.user?.userId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Add a cash movement' })
  @ApiResponse({ status: 201, description: 'Movement added successfully' })
  @ApiResponse({ status: 400, description: 'No open cash register or insufficient funds' })
  async addMovement(@Body() movementDto: CreateMovementDto, @Request() req) {
    return this.cashRegisterService.addMovement(movementDto, req.user.userId);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Register an expense' })
  @ApiResponse({ status: 201, description: 'Expense registered successfully' })
  async addExpense(@Body() expenseDto: CreateExpenseDto, @Request() req) {
    return this.cashRegisterService.addExpense(expenseDto, req.user.userId);
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Make a cash adjustment' })
  @ApiResponse({ status: 201, description: 'Adjustment made successfully' })
  async makeAdjustment(@Body() adjustmentDto: CashAdjustmentDto, @Request() req) {
    return this.cashRegisterService.makeCashAdjustment(adjustmentDto, req.user.userId);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Get all movements for a cash register session' })
  @ApiResponse({ status: 200, description: 'List of movements' })
  async getMovements(@Param('id', ParseUUIDPipe) id: string) {
    return this.cashRegisterService.getMovements(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cash register sessions' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED', 'SUSPENDED', 'RECONCILED'] })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async findAll(@Query() filters: any) {
    return this.cashRegisterService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash register by ID' })
  @ApiResponse({ status: 200, description: 'Cash register found' })
  @ApiResponse({ status: 404, description: 'Cash register not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cashRegisterService.findOne(id);
  }

  @Get('reports/daily')
  @ApiOperation({ summary: 'Get daily cash report' })
  @ApiQuery({ name: 'date', required: false, type: Date })
  async getDailyReport(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sessions = await this.cashRegisterService.findAll({
      startDate: startOfDay,
      endDate: endOfDay
    });

    return {
      date: targetDate,
      totalSessions: sessions.length,
      openSessions: sessions.filter(s => s.status === 'OPEN').length,
      closedSessions: sessions.filter(s => s.status === 'CLOSED').length,
      totalSales: sessions.reduce((sum, s) => sum + Number(s.totalSales), 0),
      totalExpenses: sessions.reduce((sum, s) => sum + Number(s.totalExpenses), 0),
      totalCash: sessions.reduce((sum, s) => sum + Number(s.totalCashSales), 0),
      sessions
    };
  }

  @Post('reports/z-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate Z report (daily closing report)' })
  @ApiResponse({ status: 200, description: 'Z report generated' })
  async generateZReport(@Request() req) {
    const currentSession = await this.cashRegisterService.getCurrentSession(req.user.userId);
    
    if (!currentSession) {
      return { error: 'No open cash register session' };
    }

    const summary = await this.cashRegisterService.getSummary(currentSession.id);
    const movements = await this.cashRegisterService.getMovements(currentSession.id);

    return {
      report: 'Z_REPORT',
      generatedAt: new Date(),
      session: summary,
      movements: movements.slice(0, 10), // Last 10 movements
      totals: {
        openingBalance: summary.openingBalance,
        currentBalance: summary.currentBalance,
        totalSales: summary.totalSales,
        totalExpenses: summary.totalExpenses,
        expectedCash: summary.currentBalance
      }
    };
  }
}
