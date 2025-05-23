import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * @file Defines a base DTO for common audit information.
 * @namespace AdManager.Platform.Backend.Core.Common.DTOs
 * @requirement REQ-15-016
 */

export abstract class BaseAuditDto {
  /**
   * The date and time when the entity was created.
   * @example "2023-10-26T08:00:00.000Z"
   */
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  /**
   * The date and time when the entity was last updated.
   * @example "2023-10-26T09:30:00.000Z"
   */
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  /**
   * The identifier of the user who created the entity.
   * @example "a1b2c3d4-e5f6-7890-1234-567890abcdef"
   */
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  /**
   * The identifier of the user who last updated the entity.
   * @example "b2c3d4e5-f6a7-8901-2345-67890abcdeff"
   */
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}