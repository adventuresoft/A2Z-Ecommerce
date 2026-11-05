import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { SkillDto, SuggestSkillDto } from './dto/index.js';
import { TaxonomyService } from './taxonomy.service.js';

@ApiTags('Freelancer Taxonomy')
@Controller('freelancer/skills')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaxonomyFreelancerController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Post('suggest')
  @ApiOperation({ summary: 'Submit a new skill suggestion for a profession' })
  @ApiResponse({
    status: 201,
    description: 'Skill suggestion created in PENDING status',
    type: SkillDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate skill exists or already submitted',
  })
  async suggestSkill(
    @CurrentUser() user: AccessPayload,
    @Body() dto: SuggestSkillDto,
  ): Promise<SkillDto> {
    return this.taxonomyService.suggestSkill(user.sub, dto);
  }
}

