import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_REGEX = /\/(jpg|jpeg|png|webp|svg\+xml|gif)$/i;

export function createImageUploadOptions(
  subdir: string,
  filePrefix: string,
): MulterOptions {
  return {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', subdir),
      filename: (_req, file, cb) => {
        const uniqueId = randomUUID();
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${filePrefix}_${uniqueId}${ext}`);
      },
    }),
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
