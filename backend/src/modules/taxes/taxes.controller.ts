import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@ApiTags('Taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tax' })
  create(@Body() createTaxDto: CreateTaxDto) {
    return this.taxesService.create(createTaxDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all taxes' })
  findAll() {
    return this.taxesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get only active taxes' })
  findActive() {
    return this.taxesService.findActive();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default tax' })
  findDefault() {
    return this.taxesService.findDefault();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tax by id' })
  findOne(@Param('id') id: string) {
    return this.taxesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax' })
  update(@Param('id') id: string, @Body() updateTaxDto: UpdateTaxDto) {
    return this.taxesService.update(id, updateTaxDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax' })
  remove(@Param('id') id: string) {
    return this.taxesService.remove(id);
  }
}