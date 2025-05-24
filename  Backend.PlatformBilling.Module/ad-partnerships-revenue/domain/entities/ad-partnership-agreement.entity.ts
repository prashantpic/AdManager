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
              @Entity('ad_partnership_agreements')
              export class AdPartnershipAgreement {
                @PrimaryGeneratedColumn('uuid')
                id: string;

                @Column({ length: 255 })
                partnerName: string;

                @Column({ type: 'text' })
                terms: string;

                @Column({ type: 'jsonb' })
                revenueShareModel: object;

                @Column({ nullable: true })
                contactEmail: string | null;

                @Column({ type: 'timestamp with time zone' })
                startDate: Date;

                @Column({ type: 'timestamp with time zone', nullable: true })
                endDate: Date | null;

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