import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RoleSummaryDto {
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
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiPropertyOptional()
  roleId?: string | null;

  @ApiPropertyOptional({ type: () => RoleSummaryDto })
  roleDefinition?: RoleSummaryDto | null;

  @ApiPropertyOptional()
  department?: string | null;

  @ApiPropertyOptional()
  section?: string | null;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  tokenVersion!: number;

  @ApiPropertyOptional()
  emailVerifiedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items!: UserResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
