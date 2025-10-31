import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Permissions, Permission } from '../users/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @Permissions(Permission.PRODUCTS_CREATE)
  @ApiCreatedResponse({ description: 'Creates a new product along with its variants.' })
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: User) {
    return this.productsService.create(createProductDto, user.tenantId);
  }

  @Post('upload-image')
  @Permissions(Permission.PRODUCTS_CREATE)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Uploads and optimizes a product image.' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.uploadService.uploadProductImage(file);
    return { imageUrl };
  }

  @Get()
  @Permissions(Permission.PRODUCTS_READ)
  @ApiOkResponse({ description: 'Returns all products.' })
  findAll(@CurrentUser() user: User): Promise<ProductResponseDto[]> {
    return this.productsService.findAll(user.tenantId);
  }

  @Get(':id')
  @Permissions(Permission.PRODUCTS_READ)
  @ApiOkResponse({ description: 'Returns a product by its ID.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.productsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Permissions(Permission.PRODUCTS_UPDATE)
  @ApiOkResponse({ description: 'Updates a product and its variants.' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateProductDto: UpdateProductDto, @CurrentUser() user: User) {
    return this.productsService.update(id, updateProductDto, user.tenantId);
  }

  @Delete(':id')
  @Permissions(Permission.PRODUCTS_DELETE)
  @ApiOkResponse({ description: 'Deletes a product and its variants.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return this.productsService.remove(id, user.tenantId);
  }
}
