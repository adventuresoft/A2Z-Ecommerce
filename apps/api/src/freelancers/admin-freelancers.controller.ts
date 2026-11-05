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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminFreelancersService } from './admin-freelancers.service.js';
import {
  AdminFreelancerQueryDto,
  AdminRevisionQueryDto,
  RejectFreelancerDto,
  RejectRevisionDto,
  SuspendFreelancerDto,
} from './dto/freelancer-admin.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';

@ApiTags('Admin Freelancers')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminFreelancersController {
  constructor(private readonly adminService: AdminFreelancersService) {}

  @Get('freelancers')
  @ApiOperation({ summary: 'List freelancers for moderation with filters' })
  async listFreelancers(@Query() query: AdminFreelancerQueryDto) {
    return this.adminService.listFreelancers(query);
  }

  @Get('freelancers/:id')
  @ApiOperation({ summary: 'Get full freelancer profile details for admin review' })
  async getFreelancerById(@Param('id') id: string) {
    return this.adminService.getFreelancerById(id);
  }

  @Post('freelancers/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve pending freelancer profile' })
  async approveFreelancer(
    @Param('id') id: string,
    @CurrentUser() adminUser: AccessPayload,
  ) {
    return this.adminService.approveFreelancer(id, adminUser.sub);
  }

  @Post('freelancers/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject pending freelancer profile with reason' })
  async rejectFreelancer(
    @Param('id') id: string,
    @Body() dto: RejectFreelancerDto,
  ) {
    return this.adminService.rejectFreelancer(id, dto);
  }

  @Post('freelancers/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend an approved freelancer' })
  async suspendFreelancer(
    @Param('id') id: string,
    @Body() dto: SuspendFreelancerDto,
  ) {
    return this.adminService.suspendFreelancer(id, dto);
  }

  @Post('freelancers/:id/reinstate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reinstate a suspended freelancer' })
  async reinstateFreelancer(@Param('id') id: string) {
    return this.adminService.reinstateFreelancer(id);
  }

  @Get('revisions')
  @ApiOperation({ summary: 'List pending profile revisions' })
  async listRevisions(@Query() query: AdminRevisionQueryDto) {
    return this.adminService.listRevisions(query);
  }

  @Post('revisions/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve profile revision and merge diff into live profile' })
  async approveRevision(
    @Param('id') id: string,
    @CurrentUser() adminUser: AccessPayload,
  ) {
    return this.adminService.approveRevision(id, adminUser.sub);
  }

  @Post('revisions/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject profile revision' })
  async rejectRevision(
    @Param('id') id: string,
    @Body() dto: RejectRevisionDto,
    @CurrentUser() adminUser: AccessPayload,
  ) {
    return this.adminService.rejectRevision(id, dto, adminUser.sub);
  }
}

