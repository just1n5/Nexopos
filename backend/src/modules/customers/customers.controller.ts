import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  create(@Body() createCustomerDto: CreateCustomerDto, @CurrentUser() user: User) {
    return this.customersService.create(createCustomerDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  findAll(@CurrentUser() user: User) {
    return this.customersService.findAll(user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get only active customers' })
  findActive(@CurrentUser() user: User) {
    return this.customersService.findActive(user.tenantId);
  }

  @Get('with-credit')
  @ApiOperation({ summary: 'Get customers with outstanding credit' })
  findWithCredit(@CurrentUser() user: User) {
    return this.customersService.findWithCredit(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by id' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customersService.findOne(id, user.tenantId);
  }

  @Get('document/:documentNumber')
  @ApiOperation({ summary: 'Get a customer by document number' })
  findByDocument(@Param('documentNumber') documentNumber: string, @CurrentUser() user: User) {
    return this.customersService.findByDocument(documentNumber, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @CurrentUser() user: User) {
    return this.customersService.update(id, updateCustomerDto, user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customersService.remove(id, user.tenantId);
  }
}