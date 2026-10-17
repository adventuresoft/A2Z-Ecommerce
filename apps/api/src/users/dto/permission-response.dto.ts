import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'user.read' })
  key!: string;

  @ApiProperty({ example: 'Read Users' })
  name!: string;

  @ApiProperty({ example: 'users' })
  module!: string;

  @ApiProperty({ example: 'read' })
  action!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
