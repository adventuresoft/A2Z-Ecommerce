import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerStatusDto {
  @ApiProperty({ description: 'Active or inactive status toggle' })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Reason for status change or moderation note' })
  @IsOptional()
  @IsString()
  reason?: string;
}
