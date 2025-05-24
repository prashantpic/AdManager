import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PricingModel } from '../../../common/enums/pricing-model.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Domain {
            export namespace Entities {
              @Entity('promoted_listing_configs')
              export class PromotedListingConfig {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ length: 100 })
                name: string;

                @Column({ type: 'enum', enum: PricingModel })
                pricingModel: PricingModel;

                @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
                price: number | null;

                @Column({ length: 3 })
                currency: string;

                @Column({ type: 'jsonb', nullable: true })
                bidRules: object | null;

                @Column({ type: 'jsonb' })
                placementRules: object;

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