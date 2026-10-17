import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import express from 'express';
import { join } from 'node:path';
import { ensureUploadDirs } from './common/uploads/image-upload.js';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Static uploads directories
  ensureUploadDirs(['categories', 'brands', 'products']);
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS Configuration
  const defaultCors =
    'http://localhost:3000,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3002';
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', defaultCors)
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'api/docs-json'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AZ E-Commerce API')
    .setDescription('Single-Vendor E-Commerce Backend REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}
await bootstrap();
