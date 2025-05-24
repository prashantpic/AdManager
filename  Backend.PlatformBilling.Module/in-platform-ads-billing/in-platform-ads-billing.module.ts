import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InPlatformAdsController } from './adapters/in-platform-ads.controller';
import { AdminInPlatformAdsController } from './adapters/admin-in-platform-ads.controller';
import { InPlatformAdsBillingApplicationService } from './application/services/in-platform-ads-billing.application-service';
import { PromotedListingConfig } from './domain/entities/promoted-listing-config.entity';
import { PromotedListingCharge } from './domain/entities/promoted-listing-charge.entity';
import { PromotedListingBid } from './domain/entities/promoted-listing-bid.entity';
import { TypeOrmPromotedListingConfigRepository } from './infrastructure/repositories/typeorm-promoted-listing-config.repository';
import { TypeOrmPromotedListingChargeRepository } from './infrastructure/repositories/typeorm-promoted-listing-charge.repository';
import { TypeOrmPromotedListingBidRepository } from './infrastructure/repositories/typeorm-promoted-listing-bid.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromotedListingConfig,
      PromotedListingCharge,
      PromotedListingBid,
    ]),
  ],
  controllers: [InPlatformAdsController, AdminInPlatformAdsController],
  providers: [
    InPlatformAdsBillingApplicationService,
    {
      provide: 'IPromotedListingConfigRepository',
      useClass: TypeOrmPromotedListingConfigRepository,
    },
    {
      provide: 'IPromotedListingChargeRepository',
      useClass: TypeOrmPromotedListingChargeRepository,
    },
    {
      provide: 'IPromotedListingBidRepository',
      useClass: TypeOrmPromotedListingBidRepository,
    },
  ],
  exports: [InPlatformAdsBillingApplicationService],
})
export class InPlatformAdsBillingModule {}