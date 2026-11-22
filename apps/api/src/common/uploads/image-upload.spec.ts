import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  optimizeAndStoreImage,
  type MediaStorageAdapter,
} from './image-upload.js';

class InMemoryMediaStorageAdapter implements MediaStorageAdapter {
  public readonly files = new Map<string, Buffer>();

  async save(subdir: string, filename: string, data: Buffer) {
    const key = `${subdir}/${filename}`;
    this.files.set(key, data);
    return { path: `/mem/${key}`, url: `/uploads/${key}` };
  }

  async remove(subdir: string, filename: string) {
    this.files.delete(`${subdir}/${filename}`);
  }
}

describe('image-upload WebP optimization pipeline', () => {
  it('converts raster PNG uploads into primary, 800px medium, and 400px thumb WebP derivatives', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 1200,
        height: 1200,
        channels: 4,
        background: { r: 29, g: 78, b: 216, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const storage = new InMemoryMediaStorageAdapter();
    const res = await optimizeAndStoreImage({
      buffer: pngBuffer,
      originalname: 'hero-product.png',
      mimetype: 'image/png',
      subdir: 'products',
      filePrefix: 'product',
      storage,
    });

    expect(res.mimetype).toBe('image/webp');
    expect(res.filename.endsWith('.webp')).toBe(true);
    expect(res.primaryUrl).toMatch(/^\/uploads\/products\/product_.*\.webp$/);
    expect(res.mediumUrl).toMatch(/-md\.webp$/);
    expect(res.thumbUrl).toMatch(/-thumb\.webp$/);
    expect(storage.files.size).toBe(3);

    const thumbKey = Array.from(storage.files.keys()).find((k) => k.endsWith('-thumb.webp'))!;
    const thumbMeta = await sharp(storage.files.get(thumbKey)!).metadata();
    expect(thumbMeta.format).toBe('webp');
    expect(thumbMeta.width).toBe(400);

    const medKey = Array.from(storage.files.keys()).find((k) => k.endsWith('-md.webp'))!;
    const medMeta = await sharp(storage.files.get(medKey)!).metadata();
    expect(medMeta.format).toBe('webp');
    expect(medMeta.width).toBe(800);
  });

  it('bypasses raster resizing safely for SVG uploads', async () => {
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"></svg>');
    const storage = new InMemoryMediaStorageAdapter();

    const res = await optimizeAndStoreImage({
      buffer: svgBuffer,
      originalname: 'logo.svg',
      mimetype: 'image/svg+xml',
      subdir: 'brands',
      filePrefix: 'brand',
      storage,
    });

    expect(res.mimetype).toBe('image/svg+xml');
    expect(res.filename.endsWith('.svg')).toBe(true);
    expect(res.mediumUrl).toBeUndefined();
    expect(res.thumbUrl).toBeUndefined();
    expect(storage.files.size).toBe(1);
  });
});
