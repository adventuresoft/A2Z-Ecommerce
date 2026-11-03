import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';


export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000,http://localhost:3002';

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'dev-insecure-access-secret-change-in-production';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET: string = 'dev-insecure-refresh-secret-change-in-production';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  MOBIREACH_BASE_URL: string = 'https://api.mobireach.com.bd';

  @IsString()
  @IsOptional()
  MOBIREACH_USERNAME: string = 'advsoft';

  @IsString()
  @IsOptional()
  MOBIREACH_PASSWORD: string = 'Dhaka@0088';

  @IsString()
  @IsOptional()
  MOBIREACH_SENDER_ID: string = '01805976387';
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}
