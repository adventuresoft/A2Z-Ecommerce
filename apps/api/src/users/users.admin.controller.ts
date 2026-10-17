import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { UsersService } from './users.service.js';
import {
  CreateUserDto,
  PaginatedUsersResponseDto,
  QueryUsersDto,
  UpdateUserDto,
  UserResponseDto,
} from './dto/index.js';

@ApiTags('Admin Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'Paginated list of system and customer users with filtering' })
  @ApiResponse({ status: 200, type: PaginatedUsersResponseDto })
  async getUsers(@Query() query: QueryUsersDto): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'Get single user profile by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getAdminUserById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('users', 'create')
  @ApiOperation({ summary: 'Create a new administrative or customer user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createAdminUser(dto);
  }

  @Patch(':id')
  @RequirePermission('users', 'update')
  @ApiOperation({ summary: 'Update user profile, status, password, or role' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or business logic error' })
  @ApiResponse({ status: 403, description: 'Forbidden action (e.g., demoting last superadmin)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AccessPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAdminUser(id, dto, currentUser.sub);
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  @ApiOperation({ summary: 'Delete user account with safety checks' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete own account' })
  @ApiResponse({ status: 403, description: 'Forbidden action' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AccessPayload,
  ): Promise<{ success: boolean; message: string }> {
    return this.usersService.deleteAdminUser(id, currentUser.sub);
  }
}
