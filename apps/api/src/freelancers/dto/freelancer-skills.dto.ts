import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ManageSkillsDto {
  @ApiProperty({
    type: [String],
    description: 'Up to 10 active skill UUIDs associated with the freelancer profession',
    example: ['0d3f2371-bf3f-42e7-a9a7-c50d322485e9'],
  })
  @IsArray()
  @ArrayMaxSize(10, { message: 'A maximum of 10 skills can be selected' })
  @IsUUID('all', { each: true, message: 'Each skill ID must be a valid UUID' })
  skillIds!: string[];
}

