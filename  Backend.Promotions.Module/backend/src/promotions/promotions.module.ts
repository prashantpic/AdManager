import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

import { DiscountCodeModule } from './discount-codes/discount-code.module';
import { BogoPromotionModule } from './bogo-promotions/bogo-promotion.module';
import { QuantityDiscountModule } from './quantity-discounts/quantity-discount.module';
import { GeneralOfferModule } from './general-offers/general-offer.module';
import { PromotionRulesModule } from './rules-engine/promotion-rules.module';
import { PromotionTrackingModule } from './tracking-reporting/promotion-tracking.module';

// Import all entities managed within this domain for TypeORM root configuration
import { DiscountCode } from './discount-codes/discount-code.entity';
import { BogoPromotion } from './bogo-promotions/bogo-promotion.entity';
import { QuantityDiscount } from './quantity-discounts/quantity-discount.entity';
import { QuantityTier } from './quantity-discounts/quantity-tier.entity';
import { GeneralOffer } from './general-offers/general-offer.entity';
import { PromotionRule } from './rules-engine/promotion-rule.entity';
import { PromotionRedemption } from './tracking-reporting/promotion-redemption.entity';

// Assuming CoreModule is imported at the application root or within sub-modules needing it (like DiscountCodeModule for ConfigService)
// import { CoreModule } from '@admanager/backend-core-module';

@Module({
  imports: [
    // Configure TypeORM for the entities in this domain
    // This allows repositories within sub-modules (e.g., DiscountCodeRepository) to be injected correctly
    // when TypeOrmModule.forFeature([Entity]) is used in those sub-modules.
    TypeOrmModule.forFeature([
        DiscountCode,
        BogoPromotion,
        QuantityDiscount,
        QuantityTier,
        GeneralOffer,
        PromotionRule,
        PromotionRedemption,
    ]),
    // Import all feature sub-modules
    DiscountCodeModule,
    BogoPromotionModule,
    QuantityDiscountModule,
    GeneralOfferModule,
    PromotionRulesModule,
    PromotionTrackingModule,
    // If CoreModule provides global services needed by PromotionsController or PromotionsService directly:
    // CoreModule,
  ],
  controllers: [PromotionsController],
  providers: [
    PromotionsService, // High-level orchestrator service for top-level operations like preview
    // Note: PromotionApplicationService is within PromotionRulesModule and used by PromotionsService.
  ],
  exports: [
      // Export services/modules that need to be accessed by other domain modules (e.g., Checkout.Orchestration.Module)
      PromotionsService, // Export the top-level service if needed
      DiscountCodeModule, // For individual promotion type management if exposed
      BogoPromotionModule,
      QuantityDiscountModule,
      GeneralOfferModule,
      PromotionRulesModule, // Export rules engine services (especially PromotionApplicationService)
      PromotionTrackingModule, // Export tracking service for Order/Checkout modules
      // Exporting TypeOrmModule.forFeature here is generally not needed if sub-modules handle their own entity registrations
      // and this root module just aggregates them. The main app module would setup TypeORM globally.
  ],
})
export class PromotionsModule {}