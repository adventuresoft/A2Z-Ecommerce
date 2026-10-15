import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({
    status: 200,
    description: 'List of active brands',
    type: [PublicBrandDto],
  })
  async findAll() {
    return this.brandsService.findAllPublic();
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
