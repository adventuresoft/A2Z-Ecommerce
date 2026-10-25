import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SyncWishlistDto {
  @ApiProperty({
    type: [String],
    example: ['c8a4d2e1-45b7-4c8d-91ef-7b6a5e123456'],
    description: 'Array of guest product IDs or slugs to merge into the customer wishlist',
  })
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}
