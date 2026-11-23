import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service.js';
import { PublicBrandDto } from './dto/index.js';

@ApiTags('Public Brands')
@Controller('brands')
export class BrandsPublicController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active brands ordered by sortOrder then name',
  })
  @ApiQuery({
    name: 'showOnHome',
    required: false,
    type: Boolean,
    description: 'When true, returns only brands checked to appear on the homepage slider',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active brands',
    type: [PublicBrandDto],
  })
  async findAll(@Query('showOnHome') showOnHome?: string) {
    const onlyHome = showOnHome === 'true' || showOnHome === '1';
    return this.brandsService.findAllPublic(onlyHome ? { showOnHome: true } : undefined);
  }

  @Get('public')
  @ApiOperation({
    summary: 'Alias for listing active brands (supports ?showOnHome=true)',
  })
  @ApiQuery({
    name: 'showOnHome',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of active brands',
    type: [PublicBrandDto],
  })
  async findAllPublicAlias(@Query('showOnHome') showOnHome?: string) {
    const onlyHome = showOnHome === 'true' || showOnHome === '1';
    return this.brandsService.findAllPublic(onlyHome ? { showOnHome: true } : undefined);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active brand details by unique slug' })
  @ApiParam({
    name: 'slug',
    description: 'Brand URL slug',
    example: 'samsung',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand public details',
    type: PublicBrandDto,
  })
  @ApiResponse({ status: 404, description: 'Brand not found or inactive' })
  async findBySlug(@Param('slug') slug: string) {
    return this.brandsService.findBySlug(slug);
  }
}
