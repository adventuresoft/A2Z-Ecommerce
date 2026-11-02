import { PartialType } from '@nestjs/swagger';
import { CreateCollectionDto } from './create-collection.dto.js';

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}

