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
import { AttributesService } from './attributes.service.js';
import {
  AttributeQueryDto,
  AttributeResponseDto,
  AttributeValueResponseDto,
  CreateAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto,
} from './dto/index.js';

@ApiTags('Admin Attributes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/attributes')
export class AttributesAdminController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new catalog attribute with optional initial values' })
  @ApiResponse({
    status: 201,
    description: 'Attribute created successfully',
    type: AttributeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Slug collision or duplicate inline values' })
  async create(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List attributes with pagination, search, type and status filters, and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated attributes list',
  })
  async findAll(@Query() query: AttributeQueryDto) {
    return this.attributesService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an attribute by ID including its values and usage counts' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiResponse({
    status: 200,
    description: 'Attribute details found',
    type: AttributeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  async findOne(@Param('id') id: string) {
    return this.attributesService.findOneAdmin(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an attribute by ID' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiResponse({
    status: 200,
    description: 'Attribute updated successfully',
    type: AttributeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @ApiResponse({ status: 409, description: 'Slug collision' })
  async update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributesService.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an attribute by ID' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  async patch(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an attribute by ID (cascades to values)' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiResponse({ status: 200, description: 'Attribute deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @ApiResponse({ status: 409, description: 'Attribute is referenced by products or variants' })
  async remove(@Param('id') id: string) {
    return this.attributesService.remove(id);
  }

  // --- Values nested endpoints ---

  @Post(':id/values')
  @ApiOperation({ summary: 'Add a new value to an existing attribute' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiResponse({
    status: 201,
    description: 'Attribute value created successfully',
    type: AttributeValueResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @ApiResponse({ status: 409, description: 'Value already exists for this attribute' })
  async createValue(
    @Param('id') attributeId: string,
    @Body() dto: CreateAttributeValueDto,
  ) {
    return this.attributesService.createValue(attributeId, dto);
  }

  @Put(':id/values/:valueId')
  @ApiOperation({ summary: 'Update an attribute value' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiParam({ name: 'valueId', description: 'AttributeValue UUID' })
  @ApiResponse({
    status: 200,
    description: 'Attribute value updated successfully',
    type: AttributeValueResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Attribute or value not found' })
  @ApiResponse({ status: 409, description: 'Value already exists for this attribute' })
  async updateValue(
    @Param('id') attributeId: string,
    @Param('valueId') valueId: string,
    @Body() dto: UpdateAttributeValueDto,
  ) {
    return this.attributesService.updateValue(attributeId, valueId, dto);
  }

  @Patch(':id/values/:valueId')
  @ApiOperation({ summary: 'Partially update an attribute value' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiParam({ name: 'valueId', description: 'AttributeValue UUID' })
  async patchValue(
    @Param('id') attributeId: string,
    @Param('valueId') valueId: string,
    @Body() dto: UpdateAttributeValueDto,
  ) {
    return this.attributesService.updateValue(attributeId, valueId, dto);
  }

  @Delete(':id/values/:valueId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an attribute value' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiParam({ name: 'valueId', description: 'AttributeValue UUID' })
  @ApiResponse({ status: 200, description: 'Attribute value deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attribute or value not found' })
  @ApiResponse({ status: 409, description: 'Value is referenced by product variants' })
  async removeValue(
    @Param('id') attributeId: string,
    @Param('valueId') valueId: string,
  ) {
    return this.attributesService.removeValue(attributeId, valueId);
  }
}
