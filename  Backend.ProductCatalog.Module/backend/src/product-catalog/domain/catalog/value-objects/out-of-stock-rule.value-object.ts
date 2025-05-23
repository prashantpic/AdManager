import { Column, Comment } from 'typeorm';
import { OutOfStockHandling } from '../../common/enums/out-of-stock-handling.enum'; // Adjusted import path

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Domain.Catalog
 * Value object for out-of-stock rules.
 * Defines how out-of-stock items should be handled in catalog feeds, ensuring immutability of the rule set.
 * Immutable object specifying the rule for out-of-stock items and the duration for temporary allowance if applicable. Used as an embedded column in the Catalog entity.
 */
export class OutOfStockRuleValueObject {
  /**
   * @member {OutOfStockHandling} handling - The rule for handling out-of-stock items.
   */
  @Column({ type: 'enum', enum: OutOfStockHandling })
  handling: OutOfStockHandling;

  /**
   * @member {number} [temporaryAllowanceDays] - Applicable if handling is ALLOW_TEMPORARILY. Defines the number of days an item can be out of stock but still included.
   */
  @Column({ type: 'integer', nullable: true })
  @Comment('Applicable if handling is ALLOW_TEMPORARILY')
  temporaryAllowanceDays?: number;
}