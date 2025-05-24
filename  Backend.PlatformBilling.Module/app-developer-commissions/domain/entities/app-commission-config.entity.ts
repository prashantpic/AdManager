import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeeType } from '../../../common/enums/fee-type.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Domain {
            export namespace Entities {
              @Entity('app_commission_configs')
              export class AppCommissionConfig {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ length: 100 })
                name: string;

                @Index()
                @Column({ type: 'uuid', nullable: true })
                appId: string | null;

                @Index()
                @Column({ type: 'uuid', nullable: true })
                developerId: string | null;

                @Column({ type: 'decimal', precision: 5, scale: 4 }) // e.g. 0.7500 for 75%
                rate: number;

                @Column({ type: 'enum', enum: FeeType })
                rateType: FeeType;

                @Column()
                calculationBasis: string;

                @Column({ length: 3 })
                currency: string;

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