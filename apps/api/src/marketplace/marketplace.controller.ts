import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service.js';
import { MarketplaceListQueryDto } from './dto/marketplace.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MembershipGuard } from '../memberships/guards/membership.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';

@ApiTags('Marketplace')
@Controller('marketplace/freelancers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  @ApiOperation({ summary: 'List visible freelancers (filters, sort, cursor)' })
  list(@Query() query: MarketplaceListQueryDto) {
    return this.marketplaceService.listFreelancers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public freelancer profile (no phone, email or address)' })
  profile(@Param('id') id: string) {
    return this.marketplaceService.getProfile(id);
  }

  @Post(':id/reveal-phone')
  @UseGuards(MembershipGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reveal the freelancer phone number (members, daily quota)' })
  revealPhone(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.marketplaceService.revealPhone(user.sub, id, {
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }
}

