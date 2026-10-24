import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { AccountAddressesService } from './account-addresses.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/index.js';

@ApiTags('Account Addresses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('account/addresses')
export class AccountAddressesController {
  constructor(
    private readonly addressesService: AccountAddressesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List customer saved addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listAddresses(@CurrentUser() user: AccessPayload) {
    return this.addressesService.listAddresses(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAddress(
    @CurrentUser() user: AccessPayload,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.createAddress(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific saved address by id' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async getAddress(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
  ) {
    return this.addressesService.getAddress(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer saved address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a customer saved address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
  ) {
    return this.addressesService.deleteAddress(user.sub, id);
  }

  @Put(':id/default-shipping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set address as default shipping address' })
  @ApiResponse({ status: 200, description: 'Default shipping set successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefaultShipping(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
  ) {
    return this.addressesService.setDefaultShipping(user.sub, id);
  }

  @Put(':id/default-billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set address as default billing address' })
  @ApiResponse({ status: 200, description: 'Default billing set successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefaultBilling(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
  ) {
    return this.addressesService.setDefaultBilling(user.sub, id);
  }
}
