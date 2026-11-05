import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum FreelancerAvailabilityEnum {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  UNAVAILABLE = 'UNAVAILABLE',
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Md. Karim Ullah' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/profiles/avatar.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'b819f071-7006-4b2a-89a1-8fe6ec67e91d' })
  @IsOptional()
  @IsUUID()
  professionId?: string;

  @ApiPropertyOptional({ example: 'Certified Electrical Technician' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example: 'Expert in residential and commercial electrical wiring and repair.',
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ example: 'karim@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: 'House 12, Road 4, Sector 7, Uttara, Dhaka' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({
    enum: FreelancerAvailabilityEnum,
    example: FreelancerAvailabilityEnum.AVAILABLE,
  })
  @IsEnum(FreelancerAvailabilityEnum)
  availability!: FreelancerAvailabilityEnum;
}

