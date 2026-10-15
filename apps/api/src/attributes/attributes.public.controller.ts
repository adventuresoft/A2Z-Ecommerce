import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttributesService } from './attributes.service.js';
import { PublicAttributeDto } from './dto/index.js';

@ApiTags('Public Attributes')
@Controller('attributes')
export class AttributesPublicController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @ApiOperation({
    summary: 'List active attributes and their active values ordered by sortOrder then name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active attributes with values',
    type: [PublicAttributeDto],
  })
  async findAll() {
    return this.attributesService.findAllPublic();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active attribute details and values by slug' })
  @ApiParam({
    name: 'slug',
    description: 'Attribute URL slug',
    example: 'color',
  })
  @ApiResponse({
    status: 200,
    description: 'Active attribute public details and active values',
    type: PublicAttributeDto,
  })
  @ApiResponse({ status: 404, description: 'Attribute not found or inactive' })
  async findBySlug(@Param('slug') slug: string) {
    return this.attributesService.findBySlugPublic(slug);
  }
}
