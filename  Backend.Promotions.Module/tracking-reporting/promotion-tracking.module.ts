import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionRedemption } from './promotion-redemption.entity';
import { PromotionTrackingService } from './promotion-tracking.service';
import { PromotionReportingService } from './promotion-reporting.service';
import { PromotionRedemptionRepository } from './promotion-redemption.repository';
// Import DiscountCodeModule if PromotionTrackingService needs to call DiscountCodeService to update usage counts.
import { DiscountCodeModule } from '../discount-codes/discount-code.module';

/**
 * REQ-PM-004, REQ-PM-005: Encapsulates promotion tracking and reporting.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PromotionRedemption]),
    DiscountCodeModule, // Needed if tracking service updates discount code usage counts via DiscountCodeService
    // Import other specific promotion modules if their services are needed for usage tracking updates
  ],
  providers: [
    // PromotionTrackingService,
    // PromotionReportingService,
    // {
    //   provide: 'IPromotionRedemptionRepository',
    //   useClass: PromotionRedemptionRepository,
    // },
  ],
  exports: [
    // PromotionTrackingService, // Export for Order/Checkout modules
    // PromotionReportingService, // Export for Analytics/Frontend consumers
    // TypeOrmModule,
  ],
})
export class PromotionTrackingModule {}