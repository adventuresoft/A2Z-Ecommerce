import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateThresholdDto {
  @ApiProperty({
    description: 'Minimum stock count triggering a low-stock alert',
    example: 10,
    default: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold: number;
}
