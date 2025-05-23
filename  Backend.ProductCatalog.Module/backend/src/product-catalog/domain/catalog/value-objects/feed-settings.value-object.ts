import { Column } from 'typeorm';
import { FeedFormat } from '../../common/enums/feed-format.enum'; // Adjusted import path

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Domain.Catalog
 * Value object for catalog feed settings.
 * Encapsulates settings related to how a catalog feed is generated, ensuring consistency and immutability.
 * Immutable object representing feed format and an optional custom file name. Used as an embedded column in the Catalog entity.
 */
export class FeedSettingsValueObject {
  /**
   * @member {FeedFormat} format - The format for the generated feed.
   */
  @Column({ type: 'enum', enum: FeedFormat })
  format: FeedFormat;

  /**
   * @member {string} [customFileName] - Optional custom file name for the feed.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  customFileName?: string;
}