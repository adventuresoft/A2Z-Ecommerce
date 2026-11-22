import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export const DEV_PLACEHOLDER_SECRETS = {
  JWT_SECRET: 'dev-insecure-access-secret-change-in-production',
  JWT_REFRESH_SECRET: 'dev-insecure-refresh-secret-change-in-production',
  MOBIREACH_USERNAME: 'advsoft',
  MOBIREACH_PASSWORD: 'Dhaka@0088',
  PAYSTATION_MERCHANT_ID: '104-1653730183',
  PAYSTATION_PASSWORD: 'gamecoderstorepass',
} as const;

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
  JWT_SECRET: string = DEV_PLACEHOLDER_SECRETS.JWT_SECRET;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET: string = DEV_PLACEHOLDER_SECRETS.JWT_REFRESH_SECRET;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  MOBIREACH_BASE_URL: string = 'https://api.mobireach.com.bd';

  @IsString()
  @IsOptional()
  MOBIREACH_USERNAME: string = DEV_PLACEHOLDER_SECRETS.MOBIREACH_USERNAME;

  @IsString()
  @IsOptional()
  MOBIREACH_PASSWORD: string = DEV_PLACEHOLDER_SECRETS.MOBIREACH_PASSWORD;

  @IsString()
  @IsOptional()
  MOBIREACH_SENDER_ID: string = '01805976387';

  @IsString()
  @IsOptional()
  PAYSTATION_MERCHANT_ID?: string;

  @IsString()
  @IsOptional()
  PAYSTATION_PASSWORD?: string;

  @IsString()
  @IsOptional()
  PAYSTATION_BASE_URL?: string;

  @IsString()
  @IsOptional()
  PAYSTATION_ALLOWED_CALLBACK_ORIGINS?: string;
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

  if (validatedConfig.NODE_ENV === Environment.Production) {
    const prodErrors: string[] = [];

    if (
      !config.JWT_SECRET ||
      validatedConfig.JWT_SECRET === DEV_PLACEHOLDER_SECRETS.JWT_SECRET ||
      validatedConfig.JWT_SECRET.length < 16
    ) {
      prodErrors.push('JWT_SECRET must be explicitly configured (>= 16 chars) in production');
    }

    if (
      !config.JWT_REFRESH_SECRET ||
      validatedConfig.JWT_REFRESH_SECRET === DEV_PLACEHOLDER_SECRETS.JWT_REFRESH_SECRET ||
      validatedConfig.JWT_REFRESH_SECRET.length < 16
    ) {
      prodErrors.push('JWT_REFRESH_SECRET must be explicitly configured (>= 16 chars) in production');
    }

    if (
      !config.MOBIREACH_USERNAME ||
      validatedConfig.MOBIREACH_USERNAME === DEV_PLACEHOLDER_SECRETS.MOBIREACH_USERNAME
    ) {
      prodErrors.push('MOBIREACH_USERNAME must be explicitly configured in production');
    }

    if (
      !config.MOBIREACH_PASSWORD ||
      validatedConfig.MOBIREACH_PASSWORD === DEV_PLACEHOLDER_SECRETS.MOBIREACH_PASSWORD
    ) {
      prodErrors.push('MOBIREACH_PASSWORD must be explicitly configured in production');
    }

    if (
      config.PAYSTATION_MERCHANT_ID === DEV_PLACEHOLDER_SECRETS.PAYSTATION_MERCHANT_ID ||
      config.PAYSTATION_PASSWORD === DEV_PLACEHOLDER_SECRETS.PAYSTATION_PASSWORD
    ) {
      prodErrors.push('PayStation sandbox credentials are prohibited in production');
    }

    if (prodErrors.length > 0) {
      throw new Error(`Production environment security error: ${prodErrors.join('; ')}`);
    }
  }

  return validatedConfig;
}
