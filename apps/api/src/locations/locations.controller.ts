import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DistrictQueryDto,
  DistrictDto,
  DivisionDto,
  ThanaDto,
  ThanaQueryDto,
  PostOfficeDto,
  PostOfficeQueryDto,
  CityCorporationDto,
  CityCorporationQueryDto,
  PaurashavaDto,
  PaurashavaQueryDto,
  UnionDto,
  UnionQueryDto,
  WardDto,
  WardQueryDto,
} from './dto/index.js';
import { LocationsService } from './locations.service.js';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('divisions')
  @ApiOperation({ summary: 'List all active Bangladesh divisions' })
  @ApiResponse({
    status: 200,
    description: 'List of divisions',
    type: [DivisionDto],
  })
  async getDivisions(): Promise<DivisionDto[]> {
    return this.locationsService.getDivisions();
  }

  @Get('districts')
  @ApiOperation({ summary: 'List active Bangladesh districts (optionally filtered by divisionId)' })
  @ApiResponse({
    status: 200,
    description: 'List of districts',
    type: [DistrictDto],
  })
  async getDistricts(@Query() query: DistrictQueryDto): Promise<DistrictDto[]> {
    return this.locationsService.getDistricts(query);
  }

  @Get('thanas')
  @ApiOperation({ summary: 'List active Bangladesh thanas (optionally filtered by districtId)' })
  @ApiResponse({
    status: 200,
    description: 'List of thanas',
    type: [ThanaDto],
  })
  async getThanas(@Query() query: ThanaQueryDto): Promise<ThanaDto[]> {
    return this.locationsService.getThanas(query);
  }

  @Get('post-offices')
  @ApiOperation({ summary: 'List active Bangladesh post offices (optionally filtered by thanaId)' })
  @ApiResponse({
    status: 200,
    description: 'List of post offices',
    type: [PostOfficeDto],
  })
  async getPostOffices(@Query() query: PostOfficeQueryDto): Promise<PostOfficeDto[]> {
    return this.locationsService.getPostOffices(query);
  }

  @Get('city-corporations')
  @ApiOperation({ summary: 'List active Bangladesh city corporations (optionally filtered by districtId)' })
  @ApiResponse({
    status: 200,
    description: 'List of city corporations',
    type: [CityCorporationDto],
  })
  async getCityCorporations(@Query() query: CityCorporationQueryDto): Promise<CityCorporationDto[]> {
    return this.locationsService.getCityCorporations(query);
  }

  @Get('paurashavas')
  @ApiOperation({ summary: 'List active Bangladesh paurashavas/municipalities (optionally filtered by districtId)' })
  @ApiResponse({
    status: 200,
    description: 'List of paurashavas',
    type: [PaurashavaDto],
  })
  async getPaurashavas(@Query() query: PaurashavaQueryDto): Promise<PaurashavaDto[]> {
    return this.locationsService.getPaurashavas(query);
  }

  @Get('unions')
  @ApiOperation({ summary: 'List active Bangladesh unions (optionally filtered by thanaId)' })
  @ApiResponse({
    status: 200,
    description: 'List of unions',
    type: [UnionDto],
  })
  async getUnions(@Query() query: UnionQueryDto): Promise<UnionDto[]> {
    return this.locationsService.getUnions(query);
  }

  @Get('wards')
  @ApiOperation({ summary: 'List city corporation wards (optionally filtered by cityCorporationId)' })
  @ApiResponse({
    status: 200,
    description: 'List of wards',
    type: [WardDto],
  })
  async getWards(@Query() query: WardQueryDto): Promise<WardDto[]> {
    return this.locationsService.getWards(query);
  }
}

