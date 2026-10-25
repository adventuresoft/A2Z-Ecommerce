import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { SettingsAdminController } from './settings.admin.controller.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

describe('SettingsControllers', () => {
  let adminController: SettingsAdminController;
  let publicController: SettingsController;
  let settingsServiceMock: Partial<SettingsService>;

  beforeEach(() => {
    settingsServiceMock = {
      findAll: vi.fn(),
      findByKey: vi.fn(),
      getPublicSettings: vi.fn(),
      getGroups: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      batchUpdate: vi.fn(),
      delete: vi.fn(),
    };

    adminController = new SettingsAdminController(
      settingsServiceMock as SettingsService,
    );
    publicController = new SettingsController(
      settingsServiceMock as SettingsService,
    );
  });

  describe('SettingsAdminController', () => {
    it('should call findAll on settingsService', async () => {
      (settingsServiceMock.findAll as any).mockResolvedValue([
        { key: 'k1', value: 'v1' },
      ]);
      const res = await adminController.findAll({ group: 'GENERAL' });
      expect(res).toEqual([{ key: 'k1', value: 'v1' }]);
      expect(settingsServiceMock.findAll).toHaveBeenCalledWith({
        group: 'GENERAL',
      });
    });

    it('should call getGroups on settingsService', async () => {
      (settingsServiceMock.getGroups as any).mockResolvedValue([
        'GENERAL',
        'LOCALIZATION',
      ]);
      const res = await adminController.getGroups();
      expect(res).toEqual(['GENERAL', 'LOCALIZATION']);
    });

    it('should call findByKey on settingsService', async () => {
      (settingsServiceMock.findByKey as any).mockResolvedValue({
        key: 'store_name',
        value: 'Store',
      });
      const res = await adminController.findByKey('store_name');
      expect(res).toEqual({ key: 'store_name', value: 'Store' });
    });

    it('should call create on settingsService', async () => {
      const dto = { key: 'new_key', value: 'new_val' };
      (settingsServiceMock.create as any).mockResolvedValue(dto);
      const res = await adminController.create(dto);
      expect(res).toEqual(dto);
      expect(settingsServiceMock.create).toHaveBeenCalledWith(dto);
    });

    it('should call batchUpdate on settingsService', async () => {
      const dto = { settings: [{ key: 'k1', value: 'v1' }] };
      (settingsServiceMock.batchUpdate as any).mockResolvedValue([
        { key: 'k1', value: 'v1' },
      ]);
      const res = await adminController.batchUpdate(dto);
      expect(res).toEqual([{ key: 'k1', value: 'v1' }]);
      expect(settingsServiceMock.batchUpdate).toHaveBeenCalledWith(dto);
    });

    it('should call update on settingsService', async () => {
      const dto = { value: 'updated_val' };
      (settingsServiceMock.update as any).mockResolvedValue({
        key: 'k1',
        value: 'updated_val',
      });
      const res = await adminController.update('k1', dto);
      expect(res).toEqual({ key: 'k1', value: 'updated_val' });
      expect(settingsServiceMock.update).toHaveBeenCalledWith('k1', dto);
    });

    it('should call delete on settingsService', async () => {
      (settingsServiceMock.delete as any).mockResolvedValue({ success: true });
      const res = await adminController.delete('k1');
      expect(res).toEqual({ success: true });
      expect(settingsServiceMock.delete).toHaveBeenCalledWith('k1');
    });
  });

  describe('SettingsController (Public)', () => {
    it('should return public settings dictionary', async () => {
      (settingsServiceMock.getPublicSettings as any).mockResolvedValue({
        store_name: 'A2Z Store',
        currency_symbol: '৳',
      });
      const res = await publicController.getPublicSettings();
      expect(res).toEqual({
        store_name: 'A2Z Store',
        currency_symbol: '৳',
      });
    });

    it('should return public settings dictionary via getPublicSettingsExplicit', async () => {
      (settingsServiceMock.getPublicSettings as any).mockResolvedValue({
        store_name: 'A2Z Store',
        heroBanners: [{ id: 'b-1', title: 'Banner 1' }],
      });
      const res = await publicController.getPublicSettingsExplicit();
      expect(res).toEqual({
        store_name: 'A2Z Store',
        heroBanners: [{ id: 'b-1', title: 'Banner 1' }],
      });
    });

    it('should return setting by key if isPublic is true', async () => {
      (settingsServiceMock.findByKey as any).mockResolvedValue({
        key: 'store_name',
        value: 'A2Z Store',
        isPublic: true,
      });
      const res = await publicController.getPublicSettingByKey('store_name');
      expect(res).toEqual({
        key: 'store_name',
        value: 'A2Z Store',
        isPublic: true,
      });
    });

    it('should throw NotFoundException if setting is not public', async () => {
      (settingsServiceMock.findByKey as any).mockResolvedValue({
        key: 'secret_key',
        value: 'secret',
        isPublic: false,
      });
      await expect(
        publicController.getPublicSettingByKey('secret_key'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
