import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/index.js';

@Injectable()
export class AccountAddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [
        { isDefaultShipping: 'desc' },
        { isDefaultBilling: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getAddress(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const existingCount = await this.prisma.userAddress.count({
      where: { userId },
    });

    const isFirst = existingCount === 0;
    const shouldBeDefaultShipping = isFirst ? true : Boolean(dto.isDefaultShipping);
    const shouldBeDefaultBilling = isFirst ? true : Boolean(dto.isDefaultBilling);

    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefaultShipping) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }

      if (shouldBeDefaultBilling) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      return tx.userAddress.create({
        data: {
          userId,
          label: dto.label,
          recipientName: dto.recipientName,
          phone: dto.phone,
          streetAddress: dto.streetAddress,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country || 'Bangladesh',
          isDefaultShipping: shouldBeDefaultShipping,
          isDefaultBilling: shouldBeDefaultBilling,
        },
      });
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    await this.getAddress(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefaultShipping) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultShipping: true, id: { not: addressId } },
          data: { isDefaultShipping: false },
        });
      }

      if (dto.isDefaultBilling) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultBilling: true, id: { not: addressId } },
          data: { isDefaultBilling: false },
        });
      }

      return tx.userAddress.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.recipientName !== undefined && {
            recipientName: dto.recipientName,
          }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.streetAddress !== undefined && {
            streetAddress: dto.streetAddress,
          }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.state !== undefined && { state: dto.state }),
          ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.isDefaultShipping !== undefined && {
            isDefaultShipping: dto.isDefaultShipping,
          }),
          ...(dto.isDefaultBilling !== undefined && {
            isDefaultBilling: dto.isDefaultBilling,
          }),
        },
      });
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.getAddress(userId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({
        where: { id: addressId },
      });

      // Promote remaining address if default was deleted
      if (address.isDefaultShipping) {
        const remaining = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (remaining) {
          await tx.userAddress.update({
            where: { id: remaining.id },
            data: { isDefaultShipping: true },
          });
        }
      }

      if (address.isDefaultBilling) {
        const remaining = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (remaining) {
          await tx.userAddress.update({
            where: { id: remaining.id },
            data: { isDefaultBilling: true },
          });
        }
      }
    });

    return { message: 'Address deleted successfully' };
  }

  async setDefaultShipping(userId: string, addressId: string) {
    await this.getAddress(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });

      return tx.userAddress.update({
        where: { id: addressId },
        data: { isDefaultShipping: true },
      });
    });
  }

  async setDefaultBilling(userId: string, addressId: string) {
    await this.getAddress(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });

      return tx.userAddress.update({
        where: { id: addressId },
        data: { isDefaultBilling: true },
      });
    });
  }
}
