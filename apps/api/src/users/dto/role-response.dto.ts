import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModuleCapabilityDto {
  @ApiProperty()
  module!: string;

  @ApiProperty()
  read!: boolean;

  @ApiProperty()
  create!: boolean;

  @ApiProperty()
  update!: boolean;

  @ApiProperty()
  delete!: boolean;
}

export class RoleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty({ type: [String] })
  permissions!: string[];

  @ApiProperty()
  permissionCount!: number;

  @ApiPropertyOptional({ type: [ModuleCapabilityDto] })
  capabilities?: ModuleCapabilityDto[];

  @ApiProperty()
  userCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
