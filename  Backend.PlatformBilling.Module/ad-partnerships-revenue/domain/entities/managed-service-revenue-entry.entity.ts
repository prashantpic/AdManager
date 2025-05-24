import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AdManager as ManagedAdServiceOfferingAdManager } from './managed-ad-service-offering.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Domain {
            export namespace Entities {
              @Entity('managed_service_revenue_entries')
              export class ManagedServiceRevenueEntry {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ type: 'uuid' })
                offeringId: string;

                @Index()
                @Column({ type: 'uuid' })
                merchantId: string;

                @Column({ type: 'decimal', precision: 14, scale: 2 })
                revenueAmount: number;

                @Column({ length: 3 })
                currency: string;

                @Column({ type: 'timestamp with time zone' })
                periodStart: Date;

                @Column({ type: 'timestamp with time zone' })
                periodEnd: Date;

                @CreateDateColumn() // This implies recordedAt = createdAt
                recordedAt: Date;

                @Column({ type: 'text', nullable: true })
                notes: string | null;

                @ManyToOne(
                  () =>
                    ManagedAdServiceOfferingAdManager.Platform.Backend
                      .PlatformBilling.AdPartnershipsRevenue.Domain.Entities
                      .ManagedAdServiceOffering,
                )
                @JoinColumn({ name: 'offeringId' })
                offering: ManagedAdServiceOfferingAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.ManagedAdServiceOffering;
              }
            }
          }
        }
      }
    }
  }
}