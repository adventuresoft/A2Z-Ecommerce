import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WishlistService } from './wishlist.service.js';
import {
  SyncWishlistDto,
  WishlistItemResponseDto,
} from './dto/index.js';

@ApiTags('Customer Wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all saved wishlist items for the authenticated customer',
  })
  @ApiResponse({ status: 200, type: [WishlistItemResponseDto] })
  async getWishlist(
    @Req() req: Request & { user: { id?: string; sub?: string } },
  ): Promise<WishlistItemResponseDto[]> {
    const userId = (req.user.id || req.user.sub)!;
    return this.wishlistService.getCustomerWishlist(userId);
  }

  @Post('guest-items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Resolve live product details, pricing, and stock status for unauthenticated guest wishlist IDs',
  })
  @ApiResponse({ status: 200, type: [WishlistItemResponseDto] })
  async getGuestWishlistItems(
    @Body() dto: SyncWishlistDto,
  ): Promise<WishlistItemResponseDto[]> {
    return this.wishlistService.getGuestWishlistProducts(dto);
  }

  @Post('sync')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Merge guest localStorage product IDs into the authenticated customer wishlist and return full synced list',
  })
  @ApiResponse({ status: 200, type: [WishlistItemResponseDto] })
  async syncWishlist(
    @Req() req: Request & { user: { id?: string; sub?: string } },
    @Body() dto: SyncWishlistDto,
  ): Promise<WishlistItemResponseDto[]> {
    const userId = (req.user.id || req.user.sub)!;
    return this.wishlistService.syncGuestWishlist(userId, dto);
  }

  @Post(':productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add a product to the authenticated customer wishlist (idempotent)',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID or slug',
  })
  @ApiResponse({ status: 200, type: WishlistItemResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addProduct(
    @Req() req: Request & { user: { id?: string; sub?: string } },
    @Param('productId') productId: string,
  ): Promise<WishlistItemResponseDto> {
    const userId = (req.user.id || req.user.sub)!;
    return this.wishlistService.addProduct(userId, productId);
  }

  @Delete(':productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a product from the authenticated customer wishlist',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID or slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Product removed from wishlist',
  })
  async removeProduct(
    @Req() req: Request & { user: { id?: string; sub?: string } },
    @Param('productId') productId: string,
  ): Promise<{ success: boolean; removedProductId: string }> {
    const userId = (req.user.id || req.user.sub)!;
    return this.wishlistService.removeProduct(userId, productId);
  }
}
