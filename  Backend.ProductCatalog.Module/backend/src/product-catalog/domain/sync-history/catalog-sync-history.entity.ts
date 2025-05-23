```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Domain.SyncHistory
// ComponentId: catalog-sync-history-repository-001
// Summary: Entity for catalog synchronization history.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-007, REQ-PCM-008, REQ-PCM-009
// Purpose: Logs attempts and outcomes of synchronizing product catalogs with external ad platforms.
// LogicDescription: Stores detailed information about each synchronization attempt, including target platform, status, start/end times, any errors encountered, specific error codes from platforms, and retry counts. Details field can store structured info like quarantined items.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  Comment,
} from 'typeorm';
import { Catalog } from '../catalog/catalog.aggregate';
import { AdPlatform } from '../../common/enums/ad-platform.enum';
import { SyncStatus } from '../../common/enums/sync-status.enum';

@Entity('catalog_sync_history')
@Index(['catalog', 'adPlatform', 'syncStartedAt'])
export class CatalogSyncHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Catalog, catalog => catalog.syncHistories, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  catalog: Catalog;

  @Column({ type: 'enum', enum: AdPlatform })
  adPlatform: AdPlatform;

  @Column()
  syncStartedAt: Date;

  @Column({ nullable: true })
  syncEndedAt?: Date;

  @Column({ type: 'enum', enum: SyncStatus })
  status: SyncStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  errorCode?: string;

  @Column({ type: 'jsonb', nullable: true })
  @Comment('Additional details, e.g., number of items processed, quarantined items')
  details?: Record<string, any> | string; // TypeORM jsonb can map to Record<string, any>

  @Column({ default: 0 })
  retries: number;
}
```