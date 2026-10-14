import { describe, it, expect, vi } from 'vitest';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

describe('HealthController', () => {
  it('should return status ok when database is healthy', async () => {
    const prismaMock = {
      $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
    } as unknown as PrismaService;

    const configServiceMock = {
      get: vi.fn().mockReturnValue('development'),
    } as unknown as ConfigService;

    const controller = new HealthController(prismaMock, configServiceMock);
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('connected');
    expect(result.environment).toBe('development');
  });

  it('should throw HttpException 503 when database is unreachable', async () => {
    const prismaMock = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('Connection failed')),
    } as unknown as PrismaService;

    const configServiceMock = {
      get: vi.fn().mockReturnValue('development'),
    } as unknown as ConfigService;

    const controller = new HealthController(prismaMock, configServiceMock);

    await expect(controller.check()).rejects.toThrow(HttpException);
  });
});
