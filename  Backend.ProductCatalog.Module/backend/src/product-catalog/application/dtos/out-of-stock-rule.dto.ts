import { IsEnum, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { OutOfStockHandling } from '../../domain/common/enums/out-of-stock-handling.enum';

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Application.Dtos
 * DTO for out-of-stock handling rules.
 * Defines the input/output structure for out-of-stock rules configuration, including validation.
 * Used as a nested DTO within CreateCatalogDto and UpdateCatalogDto to specify out-of-stock handling preferences.
 */
export class OutOfStockRuleDto {
  /**
   * @member {OutOfStockHandling} handling - The rule for handling out-of-stock items.
   */
  @IsEnum(OutOfStockHandling)
  handling: OutOfStockHandling;

  /**
   * @member {number} [temporaryAllowanceDays] - Number of days an item can be out of stock but still included,
   * applicable if handling is ALLOW_TEMPORARILY.
   */
  @IsOptional()
  @ValidateIf((o) => o.handling === OutOfStockHandling.ALLOW_TEMPORARILY)
  @IsInt()
  @Min(1)
  temporaryAllowanceDays?: number;
}