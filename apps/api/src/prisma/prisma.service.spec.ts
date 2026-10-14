import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service.js';
import { validate } from '../config/env.validation.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('PrismaService', () => {
  let service: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate,
          envFilePath: '.env',
        }),
      ],
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined and connect to database', async () => {
    expect(service).toBeDefined();
    await service.$connect();
    const result = await service.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });
});
