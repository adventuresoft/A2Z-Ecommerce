import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import {
  CreateTagDto,
  PaginatedTagResponseDto,
  TagQueryDto,
  TagResponseDto,
  UpdateTagDto,
} from './dto/index.js';
import { TagsService } from './tags.service.js';

@ApiTags('Admin Product Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/tags')
export class TagsAdminController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new catalog tag with automatic slug resolution' })
  @ApiResponse({ status: 201, type: TagResponseDto })
  async create(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return this.tagsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tags with pagination, search, status filter, and product counts' })
  @ApiResponse({ status: 200, type: PaginatedTagResponseDto })
  async findAll(@Query() query: TagQueryDto): Promise<PaginatedTagResponseDto> {
    return this.tagsService.findAll(query);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a single tag by UUID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'Tag UUID or URL slug' })
  @ApiResponse({ status: 200, type: TagResponseDto })
  async findOne(@Param('idOrSlug') idOrSlug: string): Promise<TagResponseDto> {
    return this.tagsService.findOne(idOrSlug);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tag details, slug, color code, or active status' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, type: TagResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('products', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tag and cleanly detach from associated products' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag removed and detached from products' })
  async delete(@Param('id') id: string) {
    return this.tagsService.delete(id);
  }
}
