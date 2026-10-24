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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { TaxesService } from './taxes.service.js';
import {
  CreateTaxClassDto,
  PaginatedTaxClassResponseDto,
  TaxClassQueryDto,
  TaxClassResponseDto,
  UpdateTaxClassDto,
} from './dto/index.js';

@ApiTags('Admin Taxes & VAT')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/taxes')
export class TaxesAdminController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tax class' })
  @ApiResponse({ status: 201, description: 'Tax class successfully created', type: TaxClassResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Tax class code already exists' })
  async create(@Body() dto: CreateTaxClassDto): Promise<TaxClassResponseDto> {
    return this.taxesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tax classes with pagination and optional search filter' })
  @ApiResponse({ status: 200, description: 'Paginated tax classes list', type: PaginatedTaxClassResponseDto })
  async findAll(@Query() query: TaxClassQueryDto): Promise<PaginatedTaxClassResponseDto> {
    return this.taxesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific tax class' })
  @ApiParam({ name: 'id', description: 'Tax class UUID' })
  @ApiResponse({ status: 200, description: 'Tax class details', type: TaxClassResponseDto })
  @ApiResponse({ status: 404, description: 'Tax class not found' })
  async findOne(@Param('id') id: string): Promise<TaxClassResponseDto> {
    return this.taxesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tax class' })
  @ApiParam({ name: 'id', description: 'Tax class UUID' })
  @ApiResponse({ status: 200, description: 'Tax class updated successfully', type: TaxClassResponseDto })
  @ApiResponse({ status: 404, description: 'Tax class not found' })
  @ApiResponse({ status: 409, description: 'Tax class code already in use' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxClassDto,
  ): Promise<TaxClassResponseDto> {
    return this.taxesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete or deactivate a tax class' })
  @ApiParam({ name: 'id', description: 'Tax class UUID' })
  @ApiResponse({ status: 200, description: 'Tax class deleted or deactivated' })
  @ApiResponse({ status: 400, description: 'Cannot delete default tax class' })
  @ApiResponse({ status: 404, description: 'Tax class not found' })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.taxesService.remove(id);
  }
}
