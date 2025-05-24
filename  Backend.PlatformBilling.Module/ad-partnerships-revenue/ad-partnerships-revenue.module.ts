import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAdPartnershipsController } from './adapters/admin-ad-partnerships.controller';
import { AdPartnershipApplicationService } from './application/services/ad-partnership.application-service';
import { AdPartnershipAgreement } from './domain/entities/ad-partnership-agreement.entity';
import { PartnershipRevenueEntry } from './domain/entities/partnership-revenue-entry.entity';
import { ManagedAdServiceOffering } from './domain/entities/managed-ad-service-offering.entity';
import { ManagedServiceRevenueEntry } from './domain/entities/managed-service-revenue-entry.entity';
import { TypeOrmAdPartnershipAgreementRepository } from './infrastructure/repositories/typeorm-ad-partnership-agreement.repository';
import { TypeOrmPartnershipRevenueEntryRepository } from './infrastructure/repositories/typeorm-partnership-revenue-entry.repository';
import { TypeOrmManagedAdServiceOfferingRepository } from './infrastructure/repositories/typeorm-managed-ad-service-offering.repository';
import { TypeOrmManagedServiceRevenueEntryRepository } from './infrastructure/repositories/typeorm-managed-service-revenue-entry.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdPartnershipAgreement,
      PartnershipRevenueEntry,
      ManagedAdServiceOffering,
      ManagedServiceRevenueEntry,
    ]),
  ],
  controllers: [AdminAdPartnershipsController],
  providers: [
    AdPartnershipApplicationService,
    {
      provide: 'IAdPartnershipAgreementRepository',
      useClass: TypeOrmAdPartnershipAgreementRepository,
    },
    {
      provide: 'IPartnershipRevenueEntryRepository',
      useClass: TypeOrmPartnershipRevenueEntryRepository,
    },
    {
      provide: 'IManagedAdServiceOfferingRepository',
      useClass: TypeOrmManagedAdServiceOfferingRepository,
    },
    {
      provide: 'IManagedServiceRevenueEntryRepository',
      useClass: TypeOrmManagedServiceRevenueEntryRepository,
    },
  ],
  exports: [AdPartnershipApplicationService],
})
export class AdPartnershipsRevenueModule {}