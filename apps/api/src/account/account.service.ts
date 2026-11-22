import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from '../auth/password.service.js';
import { TokenService } from '../auth/token.service.js';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  AccountOverviewResponseDto,
  DeleteAccountDto,
} from './dto/index.js';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    @Optional() private readonly tokenService?: TokenService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async getAccountOverview(userId: string): Promise<AccountOverviewResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const [totalOrders, statusGroups, recentOrdersRaw, defaultAddress] =
      await Promise.all([
        this.prisma.order.count({ where: { userId } }),
        this.prisma.order.groupBy({
          by: ['orderStatus'],
          where: { userId },
          _count: { _all: true },
        }),
        this.prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            items: {
              include: {
                variant: {
                  include: { image: true, product: true },
                },
              },
            },
          },
        }),
        this.prisma.userAddress.findFirst({
          where: { userId, isDefaultShipping: true },
        }),
      ]);

    const countMap: Record<string, number> = {};
    for (const group of statusGroups) {
      countMap[group.orderStatus] = group._count._all;
    }

    const pendingOrders = countMap[OrderStatus.PENDING] || 0;
    const processingOrders =
      (countMap[OrderStatus.PROCESSING] || 0) +
      (countMap[OrderStatus.CONFIRMED] || 0);
    const deliveredOrders = countMap[OrderStatus.DELIVERED] || 0;
    const cancelledOrders = countMap[OrderStatus.CANCELLED] || 0;

    const recentOrders = recentOrdersRaw.map((order) => {
      const itemCount = order.items.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );
      const itemsPreview = order.items.map((item) => ({
        productTitle: item.productTitle,
        thumbnailUrl:
          item.variant?.imageUrl ||
          item.variant?.image?.imageUrl ||
          item.variant?.product?.thumbnailUrl ||
          null,
        quantity: item.quantity,
      }));

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        shipmentStatus: order.shipmentStatus,
        grandTotal: Number(order.grandTotal),
        itemCount,
        createdAt: order.createdAt,
        itemsPreview,
      };
    });

    const defaultShippingAddress = defaultAddress
      ? {
          id: defaultAddress.id,
          recipientName: defaultAddress.recipientName,
          phone: defaultAddress.phone,
          streetAddress: defaultAddress.streetAddress,
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.postalCode,
          country: defaultAddress.country,
        }
      : null;

    return {
      counts: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        cancelledOrders,
      },
      recentOrders,
      defaultShippingAddress,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException('User profile not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await this.passwordService.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    if (this.prisma?.refreshSession?.updateMany) {
      await this.prisma.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!dto?.password && !dto?.verificationToken) {
      throw new BadRequestException(
        'Current password or phone verification token is required to delete account',
      );
    }

    if (dto.password) {
      const isMatch = await this.passwordService.verify(
        user.passwordHash,
        dto.password,
      );
      if (!isMatch) {
        throw new BadRequestException('Current password does not match');
      }
    } else if (dto.verificationToken) {
      if (!this.tokenService) {
        throw new BadRequestException('OTP verification is unavailable');
      }
      const payload = await this.tokenService.verifyVerificationToken(
        dto.verificationToken,
        'RESET_PASSWORD',
      );
      const userDigits = (user.phone || '').replace(/[^\d]/g, '').slice(-10);
      const tokenDigits = (payload.phone || '').replace(/[^\d]/g, '').slice(-10);
      if (!userDigits || userDigits !== tokenDigits) {
        throw new BadRequestException('Verification token does not match account phone');
      }
    }

    const unusableHash = await this.passwordService.hash(
      `deleted-${randomUUID()}-${randomUUID()}`,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: 'Deleted User',
          email: null,
          phone: null,
          passwordHash: unusableHash,
          isActive: false,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.deviceToken.deleteMany({ where: { userId } });
      await tx.userAddress.deleteMany({ where: { userId } });
      await tx.wishlistItem.deleteMany({ where: { userId } });
      await tx.cartItem.deleteMany({ where: { userId } });
    });

    return {
      message: 'Your account has been permanently deleted.',
    };
  }
}

