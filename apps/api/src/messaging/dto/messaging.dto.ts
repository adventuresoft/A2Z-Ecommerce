import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID of the approved FreelancerProfile' })
  @IsUUID()
  @IsNotEmpty()
  freelancerId!: string;

  @ApiPropertyOptional({ description: 'Optional initial message to start conversation' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  initialMessage?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Text message body (max 2000 characters)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;
}

export class ReportConversationDto {
  @ApiProperty({ description: 'Reason for reporting this conversation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  @ApiPropertyOptional({ description: 'Optional specific offending message ID' })
  @IsUUID()
  @IsOptional()
  messageId?: string;
}

export class QueryMessagesDto {
  @ApiPropertyOptional({ description: 'Fetch messages older than this message ID (reverse chronological cursor)' })
  @IsUUID()
  @IsOptional()
  beforeId?: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class BlockUserDto {
  @ApiProperty({ description: 'User ID to block' })
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;
}

