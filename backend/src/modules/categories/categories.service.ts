import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { parentId, ...categoryData } = createCategoryDto;
    
    const category = this.categoryRepository.create(categoryData);
    
    if (parentId) {
      const parent = await this.findOne(parentId);
      category.parent = parent;
    }
    
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parent: null },
      relations: ['children'],
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children']
    });
    
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    const { parentId, ...updateData } = updateCategoryDto;
    
    if (parentId) {
      if (parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      const parent = await this.findOne(parentId);
      category.parent = parent;
    }
    
    Object.assign(category, updateData);
    
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    
    // Check if category has children
    const hasChildren = await this.categoryRepository.count({
      where: { parent: { id } }
    });
    
    if (hasChildren > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }
    
    await this.categoryRepository.remove(category);
  }
}