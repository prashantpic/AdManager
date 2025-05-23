import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionRule } from './promotion-rule.entity';
import { PromotionRulesDefinitionService } from './promotion-rules.service';
import { PromotionApplicationService } from './promotion-application.service';
import { PromotionRuleRepository } from './promotion-rule.repository';
// Import specific promotion modules to access their services (for IPromotion implementations)
import { DiscountCodeModule } from '../discount-codes/discount-code.module';
import { BogoPromotionModule } from '../bogo-promotions/bogo-promotion.module';
import { QuantityDiscountModule } from '../quantity-discounts/quantity-discount.module';
import { GeneralOfferModule } from '../general-offers/general-offer.module';
// import { CoreModule } from '@admanager/backend-core-module'; // For ConfigService

/**
 * REQ-PM-008, REQ-PM-014, REQ-PM-015, REQ-PM-016: Encapsulates the promotion rules engine.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PromotionRule]),
    // Import modules whose services provide IPromotion implementations or are needed by the ApplicationService
    DiscountCodeModule,
    BogoPromotionModule,
    QuantityDiscountModule,
    GeneralOfferModule,
    // CoreModule, // If ConfigService or other core utilities are used
  ],
  providers: [
    // PromotionRulesDefinitionService,
    // PromotionApplicationService,
    // {
    //   provide: 'IPromotionRuleRepository',
    //   useClass: PromotionRuleRepository,
    // },
  ],
  exports: [
    // PromotionRulesDefinitionService,
    // PromotionApplicationService, // Exported for PromotionsController and potentially Checkout/Order modules
    // TypeOrmModule,
  ],
})
export class PromotionRulesModule {}