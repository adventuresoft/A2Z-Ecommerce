import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollectionsService } from './collections.service.js';

@ApiTags('Public Collections')
@Controller('collections')
export class CollectionsPublicController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('home')
  @ApiOperation({ summary: 'Get active collections enabled for home page display with their matching products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max products per collection (default 12)' })
  @ApiResponse({ status: 200, description: 'List of home page collections with products' })
  async getHomeCollections(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.collectionsService.findHomeCollections(limitNum);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get collection details, countdown timer, and matching products by slug' })
  @ApiParam({ name: 'slug', description: 'Collection slug', example: 'flash-sale' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Collection with products' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async getBySlug(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 24;
    return this.collectionsService.findBySlug(slug, pageNum, limitNum);
  }
}
