export namespace AdManager.Platform.Backend.ProductCatalog.Domain.Common {
  /**
   * Enum for catalog synchronization statuses within the Product Catalog domain.
   * Defines the possible states of a catalog synchronization process with an external ad platform.
   * @version 1.0.0
   * @stability Production
   */
  export enum SyncStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    SUCCESS = 'success',
    FAILED = 'failed',
    PARTIAL_SUCCESS = 'partial_success', // Some items failed, some succeeded
    QUARANTINED = 'quarantined', // Sync failed due to specific item issues, item(s) quarantined
  }
}