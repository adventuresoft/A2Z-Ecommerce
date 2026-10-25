import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import {
  CuratedProductsDto,
  PaginatedPublicProductResponseDto,
  PublicProductDetailDto,
  PublicProductQueryDto,
  SearchSuggestionsDto,
} from './dto/index.js';

@ApiTags('Public Products')
@Controller('products')
export class ProductsPublicController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('curated')
  @ApiOperation({
    summary: 'Get curated homepage product collections (flash deals, featured, new arrivals, best sellers)',
  })
  @ApiResponse({
    status: 200,
    description: 'Curated product groupings for homepage merchandising',
    type: CuratedProductsDto,
  })
  async getCurated(): Promise<CuratedProductsDto> {
    return this.productsService.getCuratedProducts();
  }

  @Get('search-suggestions')
  @ApiOperation({
    summary: 'Get debounced search autocomplete suggestions for header search',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query keyword prefix or substring',
    example: 'macbook',
  })
  @ApiResponse({
    status: 200,
    description: 'Top matching products and categories',
    type: SearchSuggestionsDto,
  })
  async getSearchSuggestions(
    @Query('q') q?: string,
  ): Promise<SearchSuggestionsDto> {
    return this.productsService.getSearchSuggestions(q);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get detailed product information by canonical URL slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Unique product URL slug',
    example: 'apple-macbook-pro-16-m3-max',
  })
  @ApiResponse({
    status: 200,
    description: 'Product master details, gallery, active variants, reviews, and related products',
    type: PublicProductDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getBySlug(
    @Param('slug') slug: string,
  ): Promise<PublicProductDetailDto> {
    return this.productsService.findPublicProductBySlug(slug);
  }

  @Get()
  @ApiOperation({
    summary: 'Query public product catalog with faceted filtering, sorting and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated public product list with pricing and availability summaries',
    type: PaginatedPublicProductResponseDto,
  })
  async getCatalog(
    @Query() query: PublicProductQueryDto,
  ): Promise<PaginatedPublicProductResponseDto> {
    return this.productsService.findPublicProducts(query);
  }
}
