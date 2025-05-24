import { Module } from '@nestjs/common';
import { TransactionFeesModule } from './transaction-fees/transaction-fees.module';
import { AppDeveloperCommissionsModule } from './app-developer-commissions/app-developer-commissions.module';
import { InPlatformAdsBillingModule } from './in-platform-ads-billing/in-platform-ads-billing.module';
import { AdPartnershipsRevenueModule } from './ad-partnerships-revenue/ad-partnerships-revenue.module';

/**
 * @description Root NestJS module for the Platform Billing domain.
 * Imports and orchestrates all feature-specific sub-modules.
 * Implemented Features: TransactionFeeManagement, AppDeveloperCommissionManagement,
 * InPlatformAdsBillingManagement, AdPartnershipsRevenueManagement.
 * @purpose To encapsulate and provide all platform billing functionalities as a cohesive
 * bounded context within the modular monolith.
 * @requirementIds REQ-MSB-008, REQ-MSB-009, REQ-MSB-010, REQ-MSB-011, REQ-MSB-012,
 * REQ-MSB-013, REQ-MSB-014, REQ-MSB-015, REQ-4.4-001, REQ-4.4-002, REQ-4.4-003,
 * REQ-4.4-005, REQ-4.4-006, REQ-4.4-007
 * @namespace AdManager.Platform.Backend.PlatformBilling
 */
@Module({
  imports: [
    TransactionFeesModule,
    AppDeveloperCommissionsModule,
    InPlatformAdsBillingModule,
    AdPartnershipsRevenueModule,
  ],
  controllers: [],
  providers: [],
  exports: [], // No direct exports needed from the root module if submodules handle their own
})
export class PlatformBillingModule {}