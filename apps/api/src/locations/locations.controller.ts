import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DistrictQueryDto, DistrictDto, DivisionDto, ThanaDto, ThanaQueryDto } from './dto/index.js';
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
  @ApiOperation({ summary: 'List active Bangladesh thanas/upazilas (optionally filtered by districtId)' })
  @ApiResponse({
    status: 200,
    description: 'List of thanas',
    type: [ThanaDto],
  })
  async getThanas(@Query() query: ThanaQueryDto): Promise<ThanaDto[]> {
    return this.locationsService.getThanas(query);
  }
}

