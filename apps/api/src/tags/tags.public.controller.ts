import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicTagDto } from './dto/index.js';
import { TagsService } from './tags.service.js';

@ApiTags('Public Product Tags')
@Controller('tags')
export class TagsPublicController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active public tags with product counts for storefront discovery',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active tags with color codes and counts',
    type: [PublicTagDto],
  })
  async findAll(): Promise<PublicTagDto[]> {
    return this.tagsService.findPublicTags();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get active tag details by unique slug or UUID' })
  @ApiParam({
    name: 'idOrSlug',
    description: 'Tag URL slug or UUID',
    example: 'summer-collection',
  })
  @ApiResponse({
    status: 200,
    description: 'Tag public details',
    type: PublicTagDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async findOne(@Param('idOrSlug') idOrSlug: string): Promise<PublicTagDto> {
    const tag = await this.tagsService.findOne(idOrSlug);
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      colorCode: tag.colorCode || null,
      productCount: tag.productCount,
    };
  }
}
