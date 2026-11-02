import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createImageUploadOptions } from '../common/uploads/image-upload.js';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CollectionsService } from './collections.service.js';
import {
  CollectionQueryDto,
  CreateCollectionDto,
  UpdateCollectionDto,
} from './dto/index.js';

@ApiTags('Admin Collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/collections')
export class CollectionsAdminController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all collections with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated collection list' })
  async findAll(@Query() query: CollectionQueryDto) {
    return this.collectionsService.findAdminAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single collection by ID with relations' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Collection details' })
  async findById(@Param('id') id: string) {
    return this.collectionsService.findAdminById(id);
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload collection banner image file (JPG, PNG, WEBP, SVG, max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', createImageUploadOptions('collections', 'col')),
  )
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return {
      imageUrl: `/uploads/collections/${file.filename}`,
      filename: file.filename,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Created collection' })
  async create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Updated collection' })
  async update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 204, description: 'Collection deleted successfully' })
  async delete(@Param('id') id: string) {
    await this.collectionsService.delete(id);
  }
}

