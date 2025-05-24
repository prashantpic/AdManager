import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdManager as PromotedListingConfigAdManager } from './promoted-listing-config.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Domain {
            export namespace Entities {
              @Entity('promoted_listing_charges')
              export class PromotedListingCharge {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Index()
                @Column({ type: 'uuid' })
                merchantId: string;

                @Column({ type: 'uuid' })
                promotedListingConfigId: string;

                @Column({ type: 'uuid' })
                productId: string;

                @Column({ type: 'decimal', precision: 12, scale: 2 })
                chargeAmount: number;

                @Column({ length: 3 })
                currency: string;

                @Column({ type: 'timestamp with time zone' })
                usagePeriodStart: Date;

                @Column({ type: 'timestamp with time zone' })
                usagePeriodEnd: Date;

                @Column({ type: 'timestamp with time zone', nullable: true })
                billedAt: Date | null;

                @Column()
                status: string; // e.g., 'ACTIVE', 'PENDING_BILLING', 'BILLED', 'CANCELLED'

                @Column({ type: 'integer', default: 0 })
                impressions: number;

                @Column({ type: 'integer', default: 0 })
                clicks: number;

                @ManyToOne(
                  () =>
                    PromotedListingConfigAdManager.Platform.Backend
                      .PlatformBilling.InPlatformAdsBilling.Domain.Entities
                      .PromotedListingConfig,
                )
                @JoinColumn({ name: 'promotedListingConfigId' })
                promotedListingConfig: PromotedListingConfigAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingConfig;
                
                // Implicit CreateDateColumn and UpdateDateColumn if inheriting from a base entity
                // For explicitness here if not using a base entity:
                @CreateDateColumn()
                createdAt: Date;

                @UpdateDateColumn()
                updatedAt: Date;
              }
            }
          }
        }
      }
    }
  }
}