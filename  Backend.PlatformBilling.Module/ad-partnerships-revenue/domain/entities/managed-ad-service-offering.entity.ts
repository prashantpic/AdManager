import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Domain {
            export namespace Entities {
              @Entity('managed_ad_service_offerings')
              export class ManagedAdServiceOffering {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ length: 255 })
                serviceName: string;

                @Column({ type: 'text' })
                description: string;

                @Column({ type: 'text' })
                terms: string;

                @Column({ type: 'jsonb' })
                pricingModel: object;

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