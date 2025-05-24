import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CommissionStatus } from '../../../common/enums/commission-status.enum';
import { AdManager as AppCommissionConfigAdManager } from './app-commission-config.entity';
import { AdManager as DeveloperPayoutAdManager } from './developer-payout.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Domain {
            export namespace Entities {
              @Entity('calculated_app_commissions')
              export class CalculatedAppCommission {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Index()
                @Column({ type: 'uuid' })
                developerId: string;

                @Index()
                @Column({ type: 'uuid' })
                appId: string;

                @Column({ type: 'uuid' })
                appCommissionConfigId: string;

                @Index()
                @Column()
                appSaleTransactionId: string;

                @Column({ type: 'decimal', precision: 12, scale: 2 })
                originalSaleAmount: number;

                @Column({ type: 'decimal', precision: 12, scale: 2 })
                commissionableAmount: number;

                @Column({ type: 'decimal', precision: 5, scale: 4 })
                commissionRate: number;

                @Column({ type: 'decimal', precision: 12, scale: 2 })
                commissionAmount: number;

                @Column({ length: 3 })
                currency: string;

                @Column({
                  type: 'enum',
                  enum: CommissionStatus,
                  default: CommissionStatus.CALCULATED,
                })
                status: CommissionStatus;

                @Column({ type: 'timestamp with time zone' })
                calculatedAt: Date;

                @Index()
                @Column({ type: 'uuid', nullable: true })
                adjustmentForRefundId: string | null; // References another CalculatedAppCommission entry if this is a clawback.

                @Index()
                @Column({ type: 'uuid', nullable: true })
                payoutId: string | null;

                @ManyToOne(
                  () =>
                    AppCommissionConfigAdManager.Platform.Backend
                      .PlatformBilling.AppDeveloperCommissions.Domain.Entities
                      .AppCommissionConfig,
                )
                @JoinColumn({ name: 'appCommissionConfigId' })
                appCommissionConfig: AppCommissionConfigAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.AppCommissionConfig;

                @ManyToOne(
                  () =>
                    DeveloperPayoutAdManager.Platform.Backend.PlatformBilling
                      .AppDeveloperCommissions.Domain.Entities.DeveloperPayout,
                  (payout) => payout.commissions,
                  { nullable: true },
                )
                @JoinColumn({ name: 'payoutId' })
                developerPayout: DeveloperPayoutAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.DeveloperPayout | null;
              }
            }
          }
        }
      }
    }
  }
}