import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service.js';
import {
  CreateMembershipCheckoutDto,
  MembershipCallbackQueryDto,
} from './dto/membership.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';

@ApiTags('Memberships')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List public active membership plans' })
  async getPlans() {
    return this.membershipsService.getPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get membership plan by ID' })
  async getPlanById(@Param('id') id: string) {
    return this.membershipsService.getPlanById(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user active membership status' })
  async getMyMembership(@CurrentUser() user: AccessPayload) {
    return this.membershipsService.getUserMembership(user.sub);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription and payment history' })
  async getMyHistory(@CurrentUser() user: AccessPayload) {
    return this.membershipsService.getUserHistory(user.sub);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate membership plan checkout' })
  async checkout(
    @CurrentUser() user: AccessPayload,
    @Body() dto: CreateMembershipCheckoutDto,
  ) {
    return this.membershipsService.initiateCheckout(user.sub, dto);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle PayStation callback / return URL' })
  async callback(
    @Query() query: MembershipCallbackQueryDto,
    @Query('paymentId') paymentId: string,
  ) {
    return this.membershipsService.handleCallback(query, paymentId);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle PayStation webhook IPN callback' })
  async ipnCallback(
    @Query() query: MembershipCallbackQueryDto,
    @Body() body: any,
  ) {
    const paymentId = body?.paymentId || query?.invoice_number;
    return this.membershipsService.handleCallback(query, paymentId);
  }
}

