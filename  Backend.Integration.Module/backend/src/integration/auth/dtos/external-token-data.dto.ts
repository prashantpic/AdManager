import { IsString, IsOptional, IsNumber, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for storing and managing external OAuth token data.
 * This structure is used by ExternalTokenService to persist and retrieve token information.
 */
export class ExternalTokenDataDto {
  /**
   * The access token provided by the external OAuth service.
   */
  @IsString()
  accessToken: string;

  /**
   * The refresh token, if provided by the external OAuth service.
   * Used to obtain a new access token when the current one expires.
   */
  @IsString()
  @IsOptional()
  refreshToken?: string;

  /**
   * The duration in seconds for which the access token is valid.
   * This is typically provided by the OAuth server.
   */
  @IsNumber()
  @IsOptional()
  expiresIn?: number;

  /**
   * An array of scopes associated with the access token.
   * Defines the permissions granted by the token.
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopes?: string[];

  /**
   * The timestamp when the token was acquired. Used in conjunction with `expiresIn`
   * to determine if the token has expired.
   * Note: This property was in the detailed file_structure_json but not in the summarized list for this task.
   * Adding it as per the full specification from the initial prompt for completeness.
   * If strictly adhering to the summarized list, this would be omitted.
   * Based on the file structure description for this DTO (3.8.5):
   * "Members: `accessToken: string`, `refreshToken?: string`, `expiresIn?: number` (seconds until expiry), `scopes?: string[]`, `acquiredAt?: Date` (timestamp for expiry calculation)."
   * Thus, including `acquiredAt`.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  acquiredAt?: Date;
}