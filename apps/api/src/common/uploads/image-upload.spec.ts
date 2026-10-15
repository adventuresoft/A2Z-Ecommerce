import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import fs from 'node:fs';
import { join } from 'node:path';
import {
  createImageUploadOptions,
  ensureUploadDirs,
  MAX_IMAGE_FILE_SIZE,
} from './image-upload.js';

describe('image-upload helper', () => {
  describe('createImageUploadOptions', () => {
    it('should configure 5 MB file size limit', () => {
      const options = createImageUploadOptions('brands', 'brand');
      expect(options.limits?.fileSize).toBe(5 * 1024 * 1024);
      expect(options.limits?.fileSize).toBe(MAX_IMAGE_FILE_SIZE);
    });

    it('should accept valid image MIME types', () => {
      const options = createImageUploadOptions('brands', 'brand');
      const fileFilter = options.fileFilter as (
        req: any,
        file: any,
        cb: (err: any, accept: boolean) => void,
      ) => void;

      const validMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/svg+xml',
        'image/gif',
      ];

      for (const mime of validMimes) {
        const cb = vi.fn();
        fileFilter({}, { mimetype: mime } as any, cb);
        expect(cb).toHaveBeenCalledWith(null, true);
      }
    });

    it('should reject invalid non-image MIME types with BadRequestException', () => {
      const options = createImageUploadOptions('brands', 'brand');
      const fileFilter = options.fileFilter as (
        req: any,
        file: any,
        cb: (err: any, accept: boolean) => void,
      ) => void;

      const invalidMimes = [
        'application/pdf',
        'text/plain',
        'image/bmp',
        'image/tiff',
        'video/mp4',
        'application/javascript',
      ];

      for (const mime of invalidMimes) {
        const cb = vi.fn();
        fileFilter({}, { mimetype: mime } as any, cb);
        expect(cb).toHaveBeenCalledWith(expect.any(BadRequestException), false);
        const err = cb.mock.calls[0][0];
        expect(err.message).toBe(
          'Only image files (JPG, PNG, WEBP, SVG, GIF) are allowed',
        );
      }
    });

    it('should generate filename in <prefix>_<uuid><ext> format', () => {
      const options = createImageUploadOptions('brands', 'brand');
      const storage = options.storage as any;

      const cb = vi.fn();
      const file = { originalname: 'My-Logo.PNG' };
      storage.getFilename({}, file, cb);

      expect(cb).toHaveBeenCalledWith(null, expect.any(String));
      const generatedFilename = cb.mock.calls[0][1];

      // Format: brand_<uuid>.png
      const regex =
        /^brand_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/;
      expect(generatedFilename).toMatch(regex);
    });

    it('should store files in process.cwd()/uploads/<subdir>', () => {
      const options = createImageUploadOptions('categories', 'cat');
      const storage = options.storage as any;

      const cb = vi.fn();
      storage.getDestination({}, {}, cb);

      expect(cb).toHaveBeenCalledWith(
        null,
        join(process.cwd(), 'uploads', 'categories'),
      );
    });
  });

  describe('ensureUploadDirs', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should create directories if they do not exist', () => {
      const existsSyncSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined as any);

      ensureUploadDirs(['categories', 'brands']);

      expect(existsSyncSpy).toHaveBeenCalledWith(
        join(process.cwd(), 'uploads', 'categories'),
      );
      expect(existsSyncSpy).toHaveBeenCalledWith(
        join(process.cwd(), 'uploads', 'brands'),
      );
      expect(mkdirSyncSpy).toHaveBeenCalledWith(
        join(process.cwd(), 'uploads', 'categories'),
        { recursive: true },
      );
      expect(mkdirSyncSpy).toHaveBeenCalledWith(
        join(process.cwd(), 'uploads', 'brands'),
        { recursive: true },
      );
    });

    it('should skip creating directories if they already exist', () => {
      const existsSyncSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined as any);

      ensureUploadDirs(['categories', 'brands']);

      expect(existsSyncSpy).toHaveBeenCalledTimes(2);
      expect(mkdirSyncSpy).not.toHaveBeenCalled();
    });
  });
});
