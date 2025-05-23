import { AdPlatform } from '../../domain/common/enums/ad-platform.enum';
import { SyncStatus } from '../../domain/common/enums/sync-status.enum';

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Application.Dtos
 * DTO for a catalog sync history record.
 * Represents a detailed log entry for a specific catalog synchronization attempt.
 * Used to display individual synchronization history records on the merchant dashboard.
 */
export class CatalogSyncHistoryDto {
  /**
   * @member {string} id - Unique identifier of the sync history entry.
   */
  id: string;

  /**
   * @member {AdPlatform} adPlatform - The advertising platform the sync was for.
   */
  adPlatform: AdPlatform;

  /**
   * @member {Date} syncStartedAt - Timestamp when the synchronization process started.
   */
  syncStartedAt: Date;

  /**
   * @member {Date} [syncEndedAt] - Timestamp when the synchronization process ended (if applicable).
   */
  syncEndedAt?: Date;

  /**
   * @member {SyncStatus} status - The final status of the synchronization attempt.
   */
  status: SyncStatus;

  /**
   * @member {string} [errorMessage] - Error message if the synchronization failed.
   */
  errorMessage?: string;

  /**
   * @member {string} [errorCode] - Platform-specific error code, if any.
   */
  errorCode?: string;

  /**
   * @member {string} [details] - Can be a summary or stringified JSON of more details regarding the sync.
   */
  details?: string; // Can be a summary or stringified JSON

  /**
   * @member {number} retries - Number of retry attempts made for this sync.
   */
  retries: number;
}