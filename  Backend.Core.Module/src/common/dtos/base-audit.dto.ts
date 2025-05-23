import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * @class BaseAuditDto
 * @description Base DTO for common audit information.
 * @Requirement REQ-15-016
 */
export abstract class BaseAuditDto {
  @ApiProperty({
    type: Date,
    description: 'The date and time when the entity was created.',
    example: '2023-01-01T12:00:00.000Z',
    readOnly: true,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional() // Usually set by the system, not by client input for create/update
  createdAt: Date;

  @ApiProperty({
    type: Date,
    description: 'The date and time when the entity was last updated.',
    example: '2023-01-01T13:00:00.000Z',
    readOnly: true,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional() // Usually set by the system
  updatedAt: Date;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the user who created the entity.',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    readOnly: true,
    required: false,
  })
  @IsUUID()
  @IsOptional() // Usually set by the system
  createdBy?: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the user who last updated the entity.',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    readOnly: true,
    required: false,
  })
  @IsUUID()
  @IsOptional() // Usually set by the system
  updatedBy?: string;
}