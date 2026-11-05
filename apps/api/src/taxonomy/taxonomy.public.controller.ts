import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ProfessionCategoryDto,
  ProfessionDto,
  ProfessionQueryDto,
  SkillDto,
  SkillQueryDto,
} from './dto/index.js';
import { TaxonomyService } from './taxonomy.service.js';

@ApiTags('Taxonomy')
@Controller('taxonomy')
export class TaxonomyPublicController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List all active profession categories' })
  @ApiResponse({
    status: 200,
    description: 'Active profession categories ordered by sortOrder',
    type: [ProfessionCategoryDto],
  })
  async getCategories(): Promise<ProfessionCategoryDto[]> {
    return this.taxonomyService.getCategories();
  }

  @Get('professions')
  @ApiOperation({ summary: 'List active professions (optionally filtered by categoryId)' })
  @ApiResponse({
    status: 200,
    description: 'Active professions ordered by sortOrder',
    type: [ProfessionDto],
  })
  async getProfessions(@Query() query: ProfessionQueryDto): Promise<ProfessionDto[]> {
    return this.taxonomyService.getProfessions(query);
  }

  @Get('skills')
  @ApiOperation({ summary: 'List active skills (optionally filtered by professionId)' })
  @ApiResponse({
    status: 200,
    description: 'Active skills ordered by name',
    type: [SkillDto],
  })
  async getSkills(@Query() query: SkillQueryDto): Promise<SkillDto[]> {
    return this.taxonomyService.getSkills(query);
  }
}

