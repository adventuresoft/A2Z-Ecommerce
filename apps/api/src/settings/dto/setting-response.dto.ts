import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty({ example: 'store_name' })
  key: string;

  @ApiProperty({ example: 'A2Z E-Commerce Store' })
  value: string;

  @ApiPropertyOptional({
    example: 'A2Z E-Commerce Store',
    description: 'Value parsed according to its dataType hint',
  })
  parsedValue?: any;

  @ApiProperty({ example: 'STRING' })
  dataType: string;

  @ApiProperty({ example: 'GENERAL' })
  group: string;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiPropertyOptional({ example: 'Primary customer-facing store brand name' })
  description?: string | null;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  updatedAt: Date;
}
