import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CategoryResponseDto, CategoryTreeNodeDto } from './dto/index.js';

@ApiTags('Public Categories')
@Controller('categories')
export class CategoriesPublicController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get active category tree hierarchy for navigation / mega-menus' })
  @ApiResponse({
    status: 200,
    description: 'Active hierarchical category tree',
    type: [CategoryTreeNodeDto],
  })
  async getTree() {
    return this.categoriesService.findPublicTree();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category details and breadcrumbs by unique slug' })
  @ApiParam({ name: 'slug', description: 'Category URL slug', example: 'laptops' })
  @ApiResponse({ status: 200, description: 'Category details with breadcrumb trail', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
