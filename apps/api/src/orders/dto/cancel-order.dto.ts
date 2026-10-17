import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: 'Reason for cancelling the order',
    example: 'Changed mind, want to order a different color',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
