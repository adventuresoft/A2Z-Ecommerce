import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import {
  PaginatedVariantResponseDto,
  ProductVariantResponseDto,
  UpdateProductVariantDto,
  VariantQueryDto,
} from './dto/index.js';
import { ProductsService } from './products.service.js';

@ApiTags('Admin Variants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/variants')
export class VariantsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Global query across all product variants (SKU index)' })
  @ApiResponse({ status: 200, type: PaginatedVariantResponseDto })
  async findAll(@Query() query: VariantQueryDto): Promise<PaginatedVariantResponseDto> {
    return this.productsService.findAllVariants(query);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a specific variant (price, barcode, imageId, isActive, attributes)' })
  @ApiParam({ name: 'id', description: 'ProductVariant UUID' })
  @ApiResponse({ status: 200, type: ProductVariantResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.productsService.updateVariant(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an individual variant' })
  @ApiParam({ name: 'id', description: 'ProductVariant UUID' })
  async delete(@Param('id') id: string) {
    return this.productsService.deleteVariant(id);
  }
}
