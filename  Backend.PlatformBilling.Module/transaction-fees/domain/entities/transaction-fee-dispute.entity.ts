import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';
import { AdManager } from './applied-transaction-fee.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Domain {
            export namespace Entities {
              @Entity('transaction_fee_disputes')
              export class TransactionFeeDispute {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ type: 'uuid' })
                appliedFeeId: string;

                @Index()
                @Column({ type: 'uuid' })
                merchantId: string;

                @Column({ type: 'text' })
                reason: string;

                @Column({
                  type: 'enum',
                  enum: DisputeStatus,
                  default: DisputeStatus.SUBMITTED,
                })
                status: DisputeStatus;

                @CreateDateColumn()
                submittedAt: Date;

                @Column({ type: 'timestamp with time zone', nullable: true })
                resolvedAt: Date | null;

                @Column({ type: 'uuid', nullable: true })
                resolvedByAdminId: string | null;

                @Column({ type: 'text', nullable: true })
                adminNotes: string | null;

                @Column({
                  type: 'decimal',
                  precision: 12,
                  scale: 2,
                  nullable: true,
                })
                adjustmentAmount: number | null;

                @Column({ type: 'text', array: true, nullable: true })
                supportingEvidenceUrls: string[] | null;

                @OneToOne(
                  () =>
                    AdManager.Platform.Backend.PlatformBilling.TransactionFees
                      .Domain.Entities.AppliedTransactionFee,
                  (fee) => fee.dispute,
                )
                @JoinColumn({ name: 'appliedFeeId' })
                appliedFee: AdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.AppliedTransactionFee;
              }
            }
          }
        }
      }
    }
  }
}