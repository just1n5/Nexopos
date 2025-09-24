import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tax } from './entities/tax.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
  ) {}

  async create(createTaxDto: CreateTaxDto): Promise<Tax> {
    // If this is set as default, unset other defaults
    if (createTaxDto.isDefault) {
      await this.taxRepository.update({ isDefault: true }, { isDefault: false });
    }
    
    const tax = this.taxRepository.create(createTaxDto);
    return this.taxRepository.save(tax);
  }

  async findAll(): Promise<Tax[]> {
    return this.taxRepository.find({
      order: { isDefault: 'DESC', name: 'ASC' }
    });
  }

  async findActive(): Promise<Tax[]> {
    return this.taxRepository.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Tax> {
    const tax = await this.taxRepository.findOne({ where: { id } });
    
    if (!tax) {
      throw new NotFoundException(`Tax with ID "${id}" not found`);
    }
    
    return tax;
  }

  async findDefault(): Promise<Tax | null> {
    return this.taxRepository.findOne({ where: { isDefault: true, isActive: true } });
  }

  async update(id: string, updateTaxDto: UpdateTaxDto): Promise<Tax> {
    const tax = await this.findOne(id);
    
    // If setting as default, unset other defaults
    if (updateTaxDto.isDefault && !tax.isDefault) {
      await this.taxRepository.update({ isDefault: true }, { isDefault: false });
    }
    
    Object.assign(tax, updateTaxDto);
    return this.taxRepository.save(tax);
  }

  async remove(id: string): Promise<void> {
    const tax = await this.findOne(id);
    
    if (tax.isDefault) {
      throw new BadRequestException('Cannot delete the default tax');
    }
    
    await this.taxRepository.remove(tax);
  }
}