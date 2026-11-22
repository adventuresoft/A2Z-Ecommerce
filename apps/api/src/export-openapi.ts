import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function exportOpenApi() {
  try {
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

    app.setGlobalPrefix('api/v1', {
      exclude: ['api/docs', 'api/docs-json'],
    });

    const swaggerConfig = new DocumentBuilder()
      .setTitle('AZ E-Commerce API')
      .setDescription('Single-Vendor E-Commerce Backend REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const outputPath = join(process.cwd(), 'openapi.json');
    writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf8');

    const schemaCount = Object.keys(document.components?.schemas ?? {}).length;
    const pathCount = Object.keys(document.paths ?? {}).length;
    console.log(
      `[OpenAPI] Exported ${pathCount} paths and ${schemaCount} schemas to ${outputPath}`,
    );

    await app.close();
    process.exit(0);
  } catch (err) {
    console.error('[OpenAPI] Export failed:', err);
    process.exit(1);
  }
}

await exportOpenApi();
