import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { ShipmentsService } from './shipments.service.js';
import {
  PublicTrackingResponseDto,
  ShipmentResponseDto,
  ShippingMethodResponseDto,
  ShippingZoneResponseDto,
} from './dto/index.js';

@ApiTags('Shipping & Tracking')
@Controller()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get('shipping/zones')
  @ApiOperation({ summary: 'Public list of active shipping delivery zones' })
  @ApiResponse({ status: 200, type: [ShippingZoneResponseDto] })
  async getActiveZones(): Promise<ShippingZoneResponseDto[]> {
    return this.shipmentsService.getAllZones(false);
  }

  @Get('shipping/methods')
  @ApiOperation({
    summary: 'Public list of active shipping methods available for checkout calculation',
  })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Optional zone ID filter' })
  @ApiResponse({ status: 200, type: [ShippingMethodResponseDto] })
  async getActiveMethods(
    @Query('zoneId') zoneId?: string,
  ): Promise<ShippingMethodResponseDto[]> {
    return this.shipmentsService.getAllMethods({ zoneId, includeInactive: false });
  }

  @Get('shipments/track/:trackingNumber')
  @ApiOperation({
    summary: 'Public shipment tracking lookup by courier tracking number',
  })
  @ApiParam({ name: 'trackingNumber', description: 'Courier tracking or consignment number' })
  @ApiResponse({ status: 200, type: PublicTrackingResponseDto })
  async trackShipment(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<PublicTrackingResponseDto> {
    return this.shipmentsService.getPublicTracking(trackingNumber);
  }

  @Get('orders/:orderId/shipments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve shipments and tracking info for an order placed by the authenticated customer',
  })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: [ShipmentResponseDto] })
  async getOrderShipments(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AccessPayload,
  ): Promise<ShipmentResponseDto[]> {
    return this.shipmentsService.getCustomerShipmentsForOrder(user.sub, orderId);
  }
}
