import { ApiProperty } from '@nestjs/swagger';

export class InventoryTimelinePointDto {
  @ApiProperty({ description: 'Date timestamp or interval bucket', example: '2026-10-15' })
  date: string;

  @ApiProperty({ description: 'Human readable interval label', example: 'Oct 15' })
  label: string;

  @ApiProperty({ description: 'Total units added via restock, initial, or returns', example: 120 })
  inflowUnits: number;

  @ApiProperty({ description: 'Total units deducted via order fulfillment, reservations, damage', example: 45 })
  outflowUnits: number;

  @ApiProperty({ description: 'Net inventory delta (inflow minus outflow)', example: 75 })
  netChange: number;

  @ApiProperty({ description: 'Net units from manual adjustments (positive or negative)', example: -2 })
  adjustmentsUnits: number;

  @ApiProperty({ description: 'Total number of stock movement transactions logged', example: 28 })
  movementEventsCount: number;
}

export class InventoryTimelineResponseDto {
  @ApiProperty({ type: [InventoryTimelinePointDto] })
  timeline: InventoryTimelinePointDto[];

  @ApiProperty({ example: 'day' })
  interval: string;
}
