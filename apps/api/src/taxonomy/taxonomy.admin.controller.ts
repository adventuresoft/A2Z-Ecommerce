import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProfessionDto,
  UpdateProfessionDto,
  CreateSkillDto,
  MergeSkillDto,
  ProfessionCategoryDto,
  ProfessionDto,
  ProfessionQueryDto,
  SkillDto,
  SuggestionQueryDto,
} from './dto/index.js';
import { TaxonomyService } from './taxonomy.service.js';

@ApiTags('Admin Taxonomy')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class TaxonomyAdminController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  // ---------------------------------------------------------------------------
  // Category Management
  // ---------------------------------------------------------------------------

  @Get('taxonomy/categories')
  @ApiOperation({ summary: 'Admin list of all profession categories (including inactive)' })
  @ApiResponse({ status: 200, type: [ProfessionCategoryDto] })
  async listCategories(): Promise<ProfessionCategoryDto[]> {
    return this.taxonomyService.getCategories(true);
  }

  @Post('taxonomy/categories')
  @ApiOperation({ summary: 'Create a new profession category' })
  @ApiResponse({ status: 201, type: ProfessionCategoryDto })
  async createCategory(@Body() dto: CreateCategoryDto): Promise<ProfessionCategoryDto> {
    return this.taxonomyService.createCategory(dto);
  }

  @Put('taxonomy/categories/:id')
  @ApiOperation({ summary: 'Update a profession category' })
  @ApiResponse({ status: 200, type: ProfessionCategoryDto })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<ProfessionCategoryDto> {
    return this.taxonomyService.updateCategory(id, dto);
  }

  // ---------------------------------------------------------------------------
  // Profession Management
  // ---------------------------------------------------------------------------

  @Get('taxonomy/professions')
  @ApiOperation({ summary: 'Admin list of all professions (including inactive)' })
  @ApiResponse({ status: 200, type: [ProfessionDto] })
  async listProfessions(@Query() query: ProfessionQueryDto): Promise<ProfessionDto[]> {
    return this.taxonomyService.getProfessions(query, true);
  }

  @Post('taxonomy/professions')
  @ApiOperation({ summary: 'Create a new profession under a category' })
  @ApiResponse({ status: 201, type: ProfessionDto })
  async createProfession(@Body() dto: CreateProfessionDto): Promise<ProfessionDto> {
    return this.taxonomyService.createProfession(dto);
  }

  @Put('taxonomy/professions/:id')
  @ApiOperation({ summary: 'Update a profession' })
  @ApiResponse({ status: 200, type: ProfessionDto })
  async updateProfession(
    @Param('id') id: string,
    @Body() dto: UpdateProfessionDto,
  ): Promise<ProfessionDto> {
    return this.taxonomyService.updateProfession(id, dto);
  }

  // ---------------------------------------------------------------------------
  // Skill Creation & Suggestion Moderation
  // ---------------------------------------------------------------------------

  @Post('taxonomy/skills')
  @ApiOperation({ summary: 'Create an active skill directly under a profession' })
  @ApiResponse({ status: 201, type: SkillDto })
  async createSkill(@Body() dto: CreateSkillDto): Promise<SkillDto> {
    return this.taxonomyService.createSkill(dto);
  }

  @Get('skills/suggestions')
  @ApiOperation({ summary: 'List pending skill suggestions for review' })
  @ApiResponse({ status: 200, type: [SkillDto] })
  async listPendingSuggestions(@Query() query: SuggestionQueryDto): Promise<SkillDto[]> {
    return this.taxonomyService.getPendingSuggestions(query);
  }

  @Post('skills/suggestions/:id/approve')
  @ApiOperation({ summary: 'Approve a pending skill suggestion to ACTIVE status' })
  @ApiResponse({ status: 200, type: SkillDto })
  async approveSuggestion(@Param('id') id: string): Promise<SkillDto> {
    return this.taxonomyService.approveSuggestion(id);
  }

  @Post('skills/suggestions/:id/reject')
  @ApiOperation({ summary: 'Reject a pending skill suggestion' })
  @ApiResponse({ status: 200, type: SkillDto })
  async rejectSuggestion(@Param('id') id: string): Promise<SkillDto> {
    return this.taxonomyService.rejectSuggestion(id);
  }

  @Post('skills/suggestions/:id/merge')
  @ApiOperation({ summary: 'Merge a pending skill suggestion into an existing active skill' })
  @ApiResponse({ status: 200, type: SkillDto })
  async mergeSuggestion(
    @Param('id') id: string,
    @Body() dto: MergeSkillDto,
  ): Promise<SkillDto> {
    return this.taxonomyService.mergeSuggestion(id, dto);
  }
}

