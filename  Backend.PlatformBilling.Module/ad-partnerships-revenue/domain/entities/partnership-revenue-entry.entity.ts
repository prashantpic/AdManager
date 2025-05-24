import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdManager as AdPartnershipAgreementAdManager } from './ad-partnership-agreement.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Domain {
            export namespace Entities {
              @Entity('partnership_revenue_entries')
              export class PartnershipRevenueEntry {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ type: 'uuid' })
                agreementId: string;

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
                    AdPartnershipAgreementAdManager.Platform.Backend
                      .PlatformBilling.AdPartnershipsRevenue.Domain.Entities
                      .AdPartnershipAgreement,
                )
                @JoinColumn({ name: 'agreementId' })
                agreement: AdPartnershipAgreementAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.AdPartnershipAgreement;
              }
            }
          }
        }
      }
    }
  }
}