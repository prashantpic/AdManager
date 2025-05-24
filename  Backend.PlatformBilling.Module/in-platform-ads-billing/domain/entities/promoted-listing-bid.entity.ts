import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { AdManager as PromotedListingChargeAdManager } from './promoted-listing-charge.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Domain {
            export namespace Entities {
              @Entity('promoted_listing_bids')
              export class PromotedListingBid {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Index()
                @Column({ type: 'uuid' })
                promotedListingChargeId: string;

                @Index()
                @Column({ type: 'uuid' })
                merchantId: string;

                @Column({ type: 'decimal', precision: 10, scale: 2 })
                bidAmount: number;

                @Column({ type: 'timestamp with time zone' })
                bidTime: Date;

                @Column()
                status: string; // e.g., 'ACTIVE_BID', 'WON_AUCTION', 'LOST_AUCTION'

                @ManyToOne(
                  () =>
                    PromotedListingChargeAdManager.Platform.Backend
                      .PlatformBilling.InPlatformAdsBilling.Domain.Entities
                      .PromotedListingCharge,
                )
                @JoinColumn({ name: 'promotedListingChargeId' })
                promotedListingCharge: PromotedListingChargeAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingCharge;
                
                // Implicit CreateDateColumn if inheriting from a base entity
                // For explicitness here if not using a base entity:
                @CreateDateColumn()
                createdAt: Date;
              }
            }
          }
        }
      }
    }
  }
}