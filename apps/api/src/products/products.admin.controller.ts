import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { createImageUploadOptions } from '../common/uploads/image-upload.js';
import {
  CreateProductDto,
  PaginatedProductResponseDto,
  ProductImageResponseDto,
  ProductQueryDto,
  ProductResponseDto,
  ReorderProductImagesDto,
  UpdateProductDto,
  UpdateProductImageDto,
} from './dto/index.js';
import { ProductsService } from './products.service.js';

@ApiTags('Admin Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload a single image for product thumbnail or variant photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201 })
  @UseInterceptors(
    FileInterceptor('file', createImageUploadOptions('products', 'product')),
  )
  async uploadSingleImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    return {
      imageUrl: `/uploads/products/${file.filename}`,
      filename: file.filename,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product with initial variants and attribute bindings' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products with pagination, search, category/brand filters' })
  @ApiResponse({ status: 200, type: PaginatedProductResponseDto })
  async findAll(@Query() query: ProductQueryDto): Promise<PaginatedProductResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a single product by UUID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'Product UUID or URL-safe slug' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async findOne(@Param('idOrSlug') idOrSlug: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(idOrSlug);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update master product details and settings' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product and associated variants/images' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload multiple gallery images (up to 10 files, JPG/PNG/WEBP/SVG/GIF, max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: [ProductImageResponseDto] })
  @UseInterceptors(
    FilesInterceptor('files', 10, createImageUploadOptions('products', 'prod')),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ProductImageResponseDto[]> {
    return this.productsService.uploadImages(id, files);
  }

  @Patch(':productId/images/:imageId')
  @ApiOperation({ summary: 'Update gallery image details (primary cover, alt text, sortOrder)' })
  @ApiParam({ name: 'productId', description: 'Parent Product UUID' })
  @ApiParam({ name: 'imageId', description: 'ProductImage UUID' })
  @ApiResponse({ status: 200, type: ProductImageResponseDto })
  async updateImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    return this.productsService.updateImage(productId, imageId, dto);
  }

  @Delete(':productId/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a gallery image and unlink from disk' })
  @ApiParam({ name: 'productId', description: 'Parent Product UUID' })
  @ApiParam({ name: 'imageId', description: 'ProductImage UUID' })
  async deleteImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.deleteImage(productId, imageId);
  }

  @Put(':productId/images/reorder')
  @ApiOperation({ summary: 'Batch reorder gallery images' })
  @ApiParam({ name: 'productId', description: 'Parent Product UUID' })
  @ApiResponse({ status: 200, type: [ProductImageResponseDto] })
  async reorderImages(
    @Param('productId') productId: string,
    @Body() dto: ReorderProductImagesDto,
  ): Promise<ProductImageResponseDto[]> {
    return this.productsService.reorderImages(productId, dto);
  }
}
