import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import type { StorageEngine } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import sharp from 'sharp';

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_REGEX = /\/(jpg|jpeg|png|webp|svg\+xml|gif)$/i;
const RASTER_OPTIMIZABLE_MIME_REGEX = /^image\/(jpg|jpeg|png|webp)$/i;

export interface StoredMediaDerivatives {
  filename: string;
  primaryUrl: string;
  mediumUrl?: string;
  thumbUrl?: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface MediaStorageAdapter {
  save(subdir: string, filename: string, data: Buffer): Promise<{ path: string; url: string }>;
  remove(subdir: string, filename: string): Promise<void>;
}

export class LocalDiskMediaStorageAdapter implements MediaStorageAdapter {
  constructor(private readonly rootDir = join(process.cwd(), 'uploads')) {}

  async save(
    subdir: string,
    filename: string,
    data: Buffer,
  ): Promise<{ path: string; url: string }> {
    const dir = join(this.rootDir, subdir);
    await fsp.mkdir(dir, { recursive: true });
    const fullPath = join(dir, filename);
    await fsp.writeFile(fullPath, data);
    return {
      path: fullPath,
      url: `/uploads/${subdir}/${filename}`,
    };
  }

  async remove(subdir: string, filename: string): Promise<void> {
    const fullPath = join(this.rootDir, subdir, filename);
    await fsp.unlink(fullPath).catch(() => undefined);
  }
}

export async function optimizeAndStoreImage(params: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  subdir: string;
  filePrefix: string;
  storage?: MediaStorageAdapter;
}): Promise<StoredMediaDerivatives> {
  const storage = params.storage ?? new LocalDiskMediaStorageAdapter();
  const uniqueId = randomUUID();
  const baseName = `${params.filePrefix}_${uniqueId}`;

  if (RASTER_OPTIMIZABLE_MIME_REGEX.test(params.mimetype)) {
    const [primaryBuf, mediumBuf, thumbBuf] = await Promise.all([
      sharp(params.buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer(),
      sharp(params.buffer)
        .rotate()
        .resize({ width: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),
      sharp(params.buffer)
        .rotate()
        .resize({ width: 400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer(),
    ]);

    const primaryName = `${baseName}.webp`;
    const mediumName = `${baseName}-md.webp`;
    const thumbName = `${baseName}-thumb.webp`;

    const [primary, medium, thumb] = await Promise.all([
      storage.save(params.subdir, primaryName, primaryBuf),
      storage.save(params.subdir, mediumName, mediumBuf),
      storage.save(params.subdir, thumbName, thumbBuf),
    ]);

    return {
      filename: primaryName,
      primaryUrl: primary.url,
      mediumUrl: medium.url,
      thumbUrl: thumb.url,
      path: primary.path,
      size: primaryBuf.length,
      mimetype: 'image/webp',
    };
  }

  // Bypass raster resizing safely for SVG and GIF assets
  const ext = extname(params.originalname).toLowerCase() || (params.mimetype.includes('svg') ? '.svg' : '.gif');
  const filename = `${baseName}${ext}`;
  const saved = await storage.save(params.subdir, filename, params.buffer);

  return {
    filename,
    primaryUrl: saved.url,
    path: saved.path,
    size: params.buffer.length,
    mimetype: params.mimetype,
  };
}

function createOptimizedStorageEngine(
  subdir: string,
  filePrefix: string,
  storage: MediaStorageAdapter = new LocalDiskMediaStorageAdapter(),
): StorageEngine {
  return {
    _handleFile(_req, file, cb) {
      const chunks: Buffer[] = [];
      file.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      file.stream.on('error', (err) => cb(err));
      file.stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        optimizeAndStoreImage({
          buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          subdir,
          filePrefix,
          storage,
        })
          .then((stored) => {
            cb(null, {
              filename: stored.filename,
              path: stored.path,
              size: stored.size,
              mimetype: stored.mimetype,
              destination: join(process.cwd(), 'uploads', subdir),
            });
          })
          .catch((err) => cb(err as Error));
      });
    },
    _removeFile(_req, file, cb) {
      if (file.filename) {
        storage
          .remove(subdir, file.filename)
          .then(() => cb(null))
          .catch((err) => cb(err as Error));
      } else {
        cb(null);
      }
    },
  };
}

export function createImageUploadOptions(
  subdir: string,
  filePrefix: string,
  storage?: MediaStorageAdapter,
): MulterOptions {
  return {
    storage: createOptimizedStorageEngine(subdir, filePrefix, storage),
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(ALLOWED_IMAGE_MIME_REGEX)) {
        return cb(
          new BadRequestException(
            'Only image files (JPG, PNG, WEBP, SVG, GIF) are allowed',
          ),
          false,
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: MAX_IMAGE_FILE_SIZE,
    },
  };
}

export function ensureUploadDirs(subdirs: string[]): void {
  for (const subdir of subdirs) {
    const dirPath = join(process.cwd(), 'uploads', subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
