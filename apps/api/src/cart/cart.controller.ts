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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { CartService } from './cart.service.js';
import {
  AddCartItemDto,
  CartClearResponseDto,
  CartResponseDto,
  SyncCartDto,
  UpdateCartItemDto,
} from './dto/index.js';

@ApiTags('Customer Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve persisted shopping cart items for the authenticated customer' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCart(@CurrentUser() user: AccessPayload): Promise<CartResponseDto> {
    return this.cartService.getCart(user.sub);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a product variant to the authenticated customer cart (increments if already present)' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid quantity' })
  @ApiResponse({ status: 404, description: 'Variant not found or inactive' })
  async addItem(
    @CurrentUser() user: AccessPayload,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch('items/:variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update quantity of a variant in cart (0 removes the item)' })
  @ApiParam({ name: 'variantId', description: 'Product variant UUID' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async updateItem(
    @CurrentUser() user: AccessPayload,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(user.sub, variantId, dto);
  }

  @Delete('items/:variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a specific variant from the customer cart' })
  @ApiParam({ name: 'variantId', description: 'Product variant UUID' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async removeItem(
    @CurrentUser() user: AccessPayload,
    @Param('variantId') variantId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.sub, variantId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from the authenticated customer cart' })
  @ApiResponse({ status: 200, type: CartClearResponseDto })
  async clearCart(@CurrentUser() user: AccessPayload): Promise<CartClearResponseDto> {
    return this.cartService.clearCart(user.sub);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge guest cart items into the authenticated customer server cart with stock capping' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async syncCart(
    @CurrentUser() user: AccessPayload,
    @Body() dto: SyncCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.syncCart(user.sub, dto);
  }
}
