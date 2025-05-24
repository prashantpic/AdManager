import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { AdManager } from './transaction-fee-config.entity'; // Assuming TransactionFeeConfig is in the same namespace alias
import { AdManager as AdManagerDispute } from './transaction-fee-dispute.entity'; // Assuming TransactionFeeDispute is in the same namespace alias

// For simplicity, using the AdManager root namespace from one of the entity files.
// In a real scenario, you might have a central namespace definition or more specific imports.
export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Domain {
            export namespace Entities {
              @Entity('applied_transaction_fees')
              export class AppliedTransactionFee {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Index()
                @Column({ type: 'uuid' })
                merchantId: string;

                @Index()
                @Column({ type: 'uuid' })
                orderId: string;

                @Column({ type: 'uuid' })
                transactionFeeConfigId: string;

                @Column({ type: 'decimal', precision: 12, scale: 2 })
                feeAmount: number;

                @Column({ length: 3 })
                currency: string;

                @Column()
                status: string; // e.g., 'PENDING_COLLECTION', 'COLLECTED', 'DISPUTED', 'REFUNDED'

                @Column({ type: 'timestamp with time zone' })
                appliedAt: Date;

                @Column({ type: 'timestamp with time zone', nullable: true })
                collectedAt: Date | null;

                @ManyToOne(
                  () =>
                    AdManager.Platform.Backend.PlatformBilling.TransactionFees
                      .Domain.Entities.TransactionFeeConfig,
                )
                @JoinColumn({ name: 'transactionFeeConfigId' })
                transactionFeeConfig: AdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeConfig;

                @OneToOne(
                  () =>
                    AdManagerDispute.Platform.Backend.PlatformBilling
                      .TransactionFees.Domain.Entities.TransactionFeeDispute,
                  (
                    dispute,
                  ) => dispute.appliedFee,
                  { nullable: true }
                )
                // @JoinColumn() // JoinColumn is typically on the owner side of OneToOne where FK is stored
                dispute: AdManagerDispute.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeDispute | null;
              }
            }
          }
        }
      }
    }
  }
}