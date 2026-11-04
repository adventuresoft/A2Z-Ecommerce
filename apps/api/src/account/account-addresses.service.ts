import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/index.js';

@Injectable()
export class AccountAddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly addressIncludes = {
    division: { select: { id: true, name: true, bnName: true } },
    district: { select: { id: true, name: true, bnName: true } },
    thanaRel: { select: { id: true, name: true, bnName: true } },
  };

  async listAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      include: this.addressIncludes,
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
      include: this.addressIncludes,
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

    // Resolve location names if IDs are provided
    let state = dto.state;
    let city = dto.city;
    let thana = dto.thana;

    if (dto.divisionId && !state) {
      const div = await this.prisma.division.findUnique({ where: { id: dto.divisionId } });
      if (div) state = div.name;
    }

    if (dto.districtId && !city) {
      const dist = await this.prisma.district.findUnique({ where: { id: dto.districtId } });
      if (dist) city = dist.name;
    }

    if (dto.thanaId && !thana) {
      const th = await this.prisma.thana.findUnique({ where: { id: dto.thanaId } });
      if (th) thana = th.name;
    }

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
          city: city || 'Dhaka',
          state: state || null,
          thana: thana || null,
          divisionId: dto.divisionId ?? null,
          districtId: dto.districtId ?? null,
          thanaId: dto.thanaId ?? null,
          postalCode: dto.postalCode,
          country: dto.country || 'Bangladesh',
          isDefaultShipping: shouldBeDefaultShipping,
          isDefaultBilling: shouldBeDefaultBilling,
        },
        include: this.addressIncludes,
      });
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    await this.getAddress(userId, addressId);

    // Resolve location names if IDs are provided
    let state = dto.state;
    let city = dto.city;
    let thana = dto.thana;

    if (dto.divisionId && !state) {
      const div = await this.prisma.division.findUnique({ where: { id: dto.divisionId } });
      if (div) state = div.name;
    }

    if (dto.districtId && !city) {
      const dist = await this.prisma.district.findUnique({ where: { id: dto.districtId } });
      if (dist) city = dist.name;
    }

    if (dto.thanaId && !thana) {
      const th = await this.prisma.thana.findUnique({ where: { id: dto.thanaId } });
      if (th) thana = th.name;
    }

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
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(thana !== undefined && { thana }),
          ...(dto.divisionId !== undefined && { divisionId: dto.divisionId }),
          ...(dto.districtId !== undefined && { districtId: dto.districtId }),
          ...(dto.thanaId !== undefined && { thanaId: dto.thanaId }),
          ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.isDefaultShipping !== undefined && {
            isDefaultShipping: dto.isDefaultShipping,
          }),
          ...(dto.isDefaultBilling !== undefined && {
            isDefaultBilling: dto.isDefaultBilling,
          }),
        },
        include: this.addressIncludes,
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
