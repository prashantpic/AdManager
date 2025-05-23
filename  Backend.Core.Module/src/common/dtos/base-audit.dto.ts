import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * @description Base DTO for common audit information.
 * REQ-15-016
 */
export abstract class BaseAuditDto {
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Timestamp of when the entity was created.',
    example: '2023-01-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Timestamp of when the entity was last updated.',
    example: '2023-01-02T15:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'Identifier of the user who created the entity (if available).',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  createdBy?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'Identifier of the user who last updated the entity (if available).',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    required: false,
  })
  updatedBy?: string;
}