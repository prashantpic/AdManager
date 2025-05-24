import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PayoutStatus } from '../../../common/enums/payout-status.enum';
import { AdManager as CalculatedAppCommissionAdManager } from './calculated-app-commission.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Domain {
            export namespace Entities {
              @Entity('developer_payouts')
              export class DeveloperPayout {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Index()
                @Column({ type: 'uuid' })
                developerId: string;

                @Column({ type: 'decimal', precision: 14, scale: 2 })
                payoutAmount: number;

                @Column({ length: 3 })
                currency: string;

                @Column({ type: 'timestamp with time zone' })
                payoutDate: Date;

                @Column({
                  type: 'enum',
                  enum: PayoutStatus,
                  default: PayoutStatus.PENDING,
                })
                status: PayoutStatus;

                @Column({ nullable: true })
                paymentTransactionId: string | null; // ID from external payment system.

                @Column({ nullable: true })
                payoutMethod: string | null;

                @Column({ type: 'text', nullable: true })
                processingNotes: string | null;

                @OneToMany(
                  () =>
                    CalculatedAppCommissionAdManager.Platform.Backend
                      .PlatformBilling.AppDeveloperCommissions.Domain.Entities
                      .CalculatedAppCommission,
                  (commission) => commission.developerPayout,
                )
                commissions: CalculatedAppCommissionAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.CalculatedAppCommission[];

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