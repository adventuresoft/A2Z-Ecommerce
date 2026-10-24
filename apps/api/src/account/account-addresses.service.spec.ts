import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountAddressesService } from './account-addresses.service.js';
import { AccountAddressesController } from './account-addresses.controller.js';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AccountAddressesService and Controller', () => {
  let prismaMock: any;
  let service: AccountAddressesService;
  let controller: AccountAddressesController;

  beforeEach(() => {
    prismaMock = {
      userAddress: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(prismaMock)),
    };
    service = new AccountAddressesService(prismaMock);
    controller = new AccountAddressesController(service);
  });

  describe('AccountAddressesService', () => {
    it('should list addresses for user ordered by defaults', async () => {
      const addresses = [{ id: 'addr-1', isDefaultShipping: true }];
      prismaMock.userAddress.findMany.mockResolvedValue(addresses);

      const res = await service.listAddresses('u-1');
      expect(res).toEqual(addresses);
      expect(prismaMock.userAddress.findMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        orderBy: [
          { isDefaultShipping: 'desc' },
          { isDefaultBilling: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    });

    it('should throw NotFoundException if address not found or not owned by user', async () => {
      prismaMock.userAddress.findFirst.mockResolvedValue(null);
      await expect(service.getAddress('u-1', 'addr-999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should auto-designate first address as default shipping and billing', async () => {
      prismaMock.userAddress.count.mockResolvedValue(0);
      prismaMock.userAddress.create.mockResolvedValue({
        id: 'addr-1',
        userId: 'u-1',
        isDefaultShipping: true,
        isDefaultBilling: true,
      });

      const res = await service.createAddress('u-1', {
        recipientName: 'First Recipient',
        phone: '+8801700000000',
        streetAddress: 'Street 1',
        city: 'Dhaka',
        postalCode: '1200',
      });

      expect(res.isDefaultShipping).toBe(true);
      expect(res.isDefaultBilling).toBe(true);
    });

    it('should reset other defaults when creating a new default shipping address', async () => {
      prismaMock.userAddress.count.mockResolvedValue(2);
      prismaMock.userAddress.create.mockResolvedValue({
        id: 'addr-3',
        isDefaultShipping: true,
      });

      await service.createAddress('u-1', {
        recipientName: 'Second',
        phone: '+8801700000000',
        streetAddress: 'Street 2',
        city: 'Dhaka',
        postalCode: '1200',
        isDefaultShipping: true,
      });

      expect(prismaMock.userAddress.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-1', isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    });

    it('should promote remaining address when deleting default address', async () => {
      prismaMock.userAddress.findFirst.mockResolvedValueOnce({
        id: 'addr-1',
        userId: 'u-1',
        isDefaultShipping: true,
        isDefaultBilling: false,
      });
      prismaMock.userAddress.delete.mockResolvedValue({ id: 'addr-1' });
      prismaMock.userAddress.findFirst.mockResolvedValueOnce({
        id: 'addr-2',
        userId: 'u-1',
      });

      const res = await service.deleteAddress('u-1', 'addr-1');
      expect(res.message).toBe('Address deleted successfully');
      expect(prismaMock.userAddress.delete).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
      });
      expect(prismaMock.userAddress.update).toHaveBeenCalledWith({
        where: { id: 'addr-2' },
        data: { isDefaultShipping: true },
      });
    });

    it('should set default shipping atomically', async () => {
      prismaMock.userAddress.findFirst.mockResolvedValue({
        id: 'addr-2',
        userId: 'u-1',
      });
      prismaMock.userAddress.update.mockResolvedValue({
        id: 'addr-2',
        isDefaultShipping: true,
      });

      const res = await service.setDefaultShipping('u-1', 'addr-2');
      expect(res.isDefaultShipping).toBe(true);
      expect(prismaMock.userAddress.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-1', isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
      expect(prismaMock.userAddress.update).toHaveBeenCalledWith({
        where: { id: 'addr-2' },
        data: { isDefaultShipping: true },
      });
    });
  });

  describe('AccountAddressesController', () => {
    const user = { sub: 'u-1', email: 'test@az.local', role: Role.CUSTOMER };

    it('should delegate listAddresses', async () => {
      vi.spyOn(service, 'listAddresses').mockResolvedValue([]);
      expect(await controller.listAddresses(user)).toEqual([]);
    });

    it('should delegate createAddress', async () => {
      const dto = {
        recipientName: 'Recipient',
        phone: '123',
        streetAddress: 'Str',
        city: 'City',
        postalCode: '1234',
      };
      vi.spyOn(service, 'createAddress').mockResolvedValue({ id: 'new' } as any);
      expect(await controller.createAddress(user, dto)).toEqual({ id: 'new' });
    });

    it('should delegate setDefaultShipping and setDefaultBilling', async () => {
      vi.spyOn(service, 'setDefaultShipping').mockResolvedValue({ id: 'addr-1' } as any);
      vi.spyOn(service, 'setDefaultBilling').mockResolvedValue({ id: 'addr-1' } as any);

      expect(await controller.setDefaultShipping(user, 'addr-1')).toEqual({ id: 'addr-1' });
      expect(await controller.setDefaultBilling(user, 'addr-1')).toEqual({ id: 'addr-1' });
    });
  });
});
