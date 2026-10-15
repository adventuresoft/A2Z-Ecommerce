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
import { BrandsService } from './brands.service.js';
import {
  BrandQueryDto,
  BrandResponseDto,
  CreateBrandDto,
  PaginatedBrandResponseDto,
  UpdateBrandDto,
} from './dto/index.js';

@ApiTags('Admin Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/brands')
export class BrandsAdminController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post('upload-logo')
  @ApiOperation({
    summary: 'Upload brand logo image file (JPG, PNG, WEBP, SVG, GIF, max 5MB)',
  })
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
    FileInterceptor('file', createImageUploadOptions('brands', 'brand')),
  )
  async uploadLogo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }
    return {
      logoUrl: `/uploads/brands/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({
    status: 201,
    description: 'Brand created successfully',
    type: BrandResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Slug collision' })
  async create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List brands with pagination, search, status filter, and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated brand list',
    type: PaginatedBrandResponseDto,
  })
  async findAll(@Query() query: BrandQueryDto) {
    return this.brandsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand details by ID' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  @ApiResponse({
    status: 200,
    description: 'Brand details',
    type: BrandResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOneAdmin(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing brand' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  @ApiResponse({
    status: 200,
    description: 'Brand updated successfully',
    type: BrandResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @ApiResponse({ status: 409, description: 'Slug collision' })
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an unreferenced brand' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  @ApiResponse({ status: 200, description: 'Brand deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete brand referenced by products',
  })
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
