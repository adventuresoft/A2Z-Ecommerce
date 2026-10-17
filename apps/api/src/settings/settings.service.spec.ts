import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

describe('SettingsService', () => {
  let service: SettingsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      storeSetting: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prismaMock)),
    };

    service = new SettingsService(prismaMock);
  });

  describe('parseSettingValue', () => {
    it('should parse STRING', () => {
      expect(service.parseSettingValue('A2Z Store', 'STRING')).toBe('A2Z Store');
    });

    it('should parse NUMBER', () => {
      expect(service.parseSettingValue('42.5', 'NUMBER')).toBe(42.5);
      expect(service.parseSettingValue('not-a-number', 'NUMBER')).toBe('not-a-number');
    });

    it('should parse BOOLEAN', () => {
      expect(service.parseSettingValue('true', 'BOOLEAN')).toBe(true);
      expect(service.parseSettingValue('TRUE', 'BOOLEAN')).toBe(true);
      expect(service.parseSettingValue('1', 'BOOLEAN')).toBe(true);
      expect(service.parseSettingValue('false', 'BOOLEAN')).toBe(false);
      expect(service.parseSettingValue('0', 'BOOLEAN')).toBe(false);
    });

    it('should parse JSON', () => {
      expect(service.parseSettingValue('{"foo":"bar"}', 'JSON')).toEqual({ foo: 'bar' });
      expect(service.parseSettingValue('invalid-json', 'JSON')).toBe('invalid-json');
    });
  });

  describe('findAll', () => {
    it('should list all settings with parsed values', async () => {
      prismaMock.storeSetting.findMany.mockResolvedValue([
        {
          key: 'store_name',
          value: 'A2Z Store',
          dataType: 'STRING',
          group: 'GENERAL',
          isPublic: true,
          description: 'Store name',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'enable_cod',
          value: 'true',
          dataType: 'BOOLEAN',
          group: 'ORDER',
          isPublic: true,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('store_name');
      expect(result[0].parsedValue).toBe('A2Z Store');
      expect(result[1].key).toBe('enable_cod');
      expect(result[1].parsedValue).toBe(true);
    });

    it('should pass group and isPublic filters to prisma query', async () => {
      prismaMock.storeSetting.findMany.mockResolvedValue([]);
      await service.findAll({ group: 'general', isPublic: true });

      expect(prismaMock.storeSetting.findMany).toHaveBeenCalledWith({
        where: { group: 'GENERAL', isPublic: true },
        orderBy: [{ group: 'asc' }, { key: 'asc' }],
      });
    });
  });

  describe('findByKey', () => {
    it('should return setting when key exists', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue({
        key: 'min_order_subtotal',
        value: '100',
        dataType: 'NUMBER',
        group: 'ORDER',
        isPublic: true,
        description: 'Min order subtotal',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findByKey('min_order_subtotal');
      expect(result.key).toBe('min_order_subtotal');
      expect(result.parsedValue).toBe(100);
    });

    it('should throw NotFoundException if key does not exist', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue(null);

      await expect(service.findByKey('unknown_key')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPublicSettings', () => {
    it('should return a key-value dictionary of only public settings', async () => {
      prismaMock.storeSetting.findMany.mockResolvedValue([
        {
          key: 'store_name',
          value: 'A2Z Store',
          dataType: 'STRING',
          isPublic: true,
        },
        {
          key: 'free_shipping_threshold',
          value: '5000',
          dataType: 'NUMBER',
          isPublic: true,
        },
        {
          key: 'maintenance_mode',
          value: 'false',
          dataType: 'BOOLEAN',
          isPublic: true,
        },
      ]);

      const result = await service.getPublicSettings();
      expect(result).toEqual({
        store_name: 'A2Z Store',
        free_shipping_threshold: 5000,
        maintenance_mode: false,
      });
      expect(prismaMock.storeSetting.findMany).toHaveBeenCalledWith({
        where: { isPublic: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new setting successfully', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue(null);
      prismaMock.storeSetting.create.mockResolvedValue({
        key: 'custom_feature',
        value: 'enabled',
        dataType: 'STRING',
        group: 'GENERAL',
        isPublic: false,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        key: 'custom_feature',
        value: 'enabled',
      });

      expect(result.key).toBe('custom_feature');
      expect(prismaMock.storeSetting.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if key already exists', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue({ key: 'existing_key' });

      await expect(
        service.create({ key: 'existing_key', value: 'val' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update existing setting', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue({
        key: 'store_name',
        value: 'Old Name',
        dataType: 'STRING',
        group: 'GENERAL',
        isPublic: true,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.storeSetting.update.mockResolvedValue({
        key: 'store_name',
        value: 'New Name',
        dataType: 'STRING',
        group: 'GENERAL',
        isPublic: true,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update('store_name', { value: 'New Name' });
      expect(result.value).toBe('New Name');
      expect(result.parsedValue).toBe('New Name');
    });
  });

  describe('batchUpdate', () => {
    it('should execute upsert for all items within a transaction', async () => {
      prismaMock.storeSetting.findMany.mockResolvedValue([
        {
          key: 'key1',
          value: 'val1',
          dataType: 'STRING',
          group: 'GENERAL',
          isPublic: true,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: 'key2',
          value: 'val2',
          dataType: 'STRING',
          group: 'GENERAL',
          isPublic: false,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.batchUpdate({
        settings: [
          { key: 'key1', value: 'val1' },
          { key: 'key2', value: 'val2' },
        ],
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no settings provided', async () => {
      const result = await service.batchUpdate({ settings: [] });
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete existing setting', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue({ key: 'custom_key' });
      prismaMock.storeSetting.delete.mockResolvedValue({ key: 'custom_key' });

      const result = await service.delete('custom_key');
      expect(result.success).toBe(true);
      expect(prismaMock.storeSetting.delete).toHaveBeenCalledWith({
        where: { key: 'custom_key' },
      });
    });
  });

  describe('getSettingValue', () => {
    it('should return parsed setting value', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue({
        key: 'min_order_subtotal',
        value: '250',
        dataType: 'NUMBER',
      });

      const val = await service.getSettingValue('min_order_subtotal', 100);
      expect(val).toBe(250);
    });

    it('should return default value if setting does not exist', async () => {
      prismaMock.storeSetting.findUnique.mockResolvedValue(null);

      const val = await service.getSettingValue('missing_key', 'fallback');
      expect(val).toBe('fallback');
    });
  });
});
