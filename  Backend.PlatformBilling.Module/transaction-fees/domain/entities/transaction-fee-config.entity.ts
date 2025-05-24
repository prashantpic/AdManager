import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeeType } from '../../../common/enums/fee-type.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Domain {
            export namespace Entities {
              @Entity('transaction_fee_configs')
              export class TransactionFeeConfig {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ length: 100 })
                name: string;

                @Column({ type: 'enum', enum: FeeType })
                feeType: FeeType;

                @Column({ type: 'decimal', precision: 10, scale: 4 })
                value: number;

                @Column({ length: 3 })
                currency: string;

                @Column()
                calculationBasis: string;

                @Column({ type: 'uuid', array: true, nullable: true })
                applicableSubscriptionPlanIds: string[] | null;

                @Column({ default: true })
                isActive: boolean;

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