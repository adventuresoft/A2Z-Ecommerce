import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createImageUploadOptions } from '../common/uploads/image-upload.js';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CategoriesService } from './categories.service.js';
import {
  CategoryQueryDto,
  CategoryResponseDto,
  CreateCategoryDto,
  PaginatedCategoryResponseDto,
  UpdateCategoryDto,
} from './dto/index.js';

@ApiTags('Admin Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/categories')
export class CategoriesAdminController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload category image file (JPG, PNG, WEBP, SVG, max 5MB)' })
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
  @UseInterceptors(
    FileInterceptor('file', createImageUploadOptions('categories', 'cat')),
  )
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return {
      imageUrl: `/uploads/categories/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed or 3-level depth limit exceeded' })
  @ApiResponse({ status: 409, description: 'Slug collision' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List categories with pagination, search, status and parent filters' })
  @ApiResponse({ status: 200, description: 'Paginated category list', type: PaginatedCategoryResponseDto })
  async findAll(@Query() query: CategoryQueryDto) {
    return this.categoriesService.findAllAdmin(query);
  }

  @Get('parent-options')
  @ApiOperation({ summary: 'List eligible parent categories (Level 1 & 2) for form dropdowns' })
  @ApiQuery({ name: 'excludeId', required: false, description: 'Category ID to exclude along with its descendants' })
  @ApiResponse({ status: 200, description: 'List of eligible parent categories' })
  async getParentOptions(@Query('excludeId') excludeId?: string) {
    return this.categoriesService.getParentOptions(excludeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category details', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOneAdmin(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error, cycle detected, or depth limit exceeded' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Slug collision' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an empty category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete category with active subcategories or products' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
