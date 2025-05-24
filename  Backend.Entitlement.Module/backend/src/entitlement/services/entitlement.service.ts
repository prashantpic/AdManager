import { Injectable, Logger, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntitlementCacheService } from './entitlement-cache.service';
import { MerchantEntitlementDto, IFeatureEntitlementDetails } from '../dto/merchant-entitlement.dto';
import { FeatureAccessResponseDto } from '../dto/feature-access-response.dto';
import { SubscriptionChangedEventDto } from '../dto/subscription-changed.event.dto';
import { FeatureKey } from '../constants/feature.constants';
import {
  IMerchantUsageProvider,
  MERCHANT_USAGE_PROVIDER_TOKEN,
} from '../interfaces/merchant-usage-provider.interface';
import {
  ISubscriptionDataProvider,
  SUBSCRIPTION_DATA_PROVIDER,
  ISubscriptionDetails,
} from '../interfaces/subscription-data-provider.interface';
import { FeatureNotAvailableException } from '../exceptions/feature-not-available.exception';
import { EntitlementViolationException } from '../exceptions/entitlement-violation.exception';
import { EntitlementConfiguration } from '../config/entitlement.config';

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);
  private readonly entitlementConfig: EntitlementConfiguration;

  constructor(
    private readonly cacheService: EntitlementCacheService,
    private readonly configService: ConfigService,
    @Inject(SUBSCRIPTION_DATA_PROVIDER)
    private readonly subscriptionDataProvider: ISubscriptionDataProvider,
    @Inject(MERCHANT_USAGE_PROVIDER_TOKEN) // Assuming multi-injection via a token
    private readonly usageProviders: IMerchantUsageProvider[],
  ) {
    this.entitlementConfig = this.configService.get<EntitlementConfiguration>('entitlement');
  }

  private findUsageProvider(featureKey: FeatureKey): IMerchantUsageProvider | undefined {
    return this.usageProviders.find(provider => provider.supportedFeatureKeys.includes(featureKey));
  }

  async getMerchantEntitlements(merchantId: string): Promise<MerchantEntitlementDto> {
    const cachedEntitlements = await this.cacheService.getCachedEntitlements(merchantId);
    if (cachedEntitlements) {
      this.logger.debug(`Cache hit for merchant entitlements: ${merchantId}`);
      // Potentially re-validate currentUsage or grace periods if they are highly dynamic
      // For now, return cached as is, assuming cache invalidation on change is sufficient
      return cachedEntitlements;
    }
    this.logger.debug(`Cache miss for merchant entitlements: ${merchantId}. Calculating...`);

    const subscriptionDetails = await this.subscriptionDataProvider.getMerchantSubscription(merchantId);

    if (!subscriptionDetails || subscriptionDetails.status !== 'active') {
      this.logger.warn(`No active subscription found for merchant ${merchantId}. Returning minimal entitlements.`);
      // Return minimal/default entitlements for inactive/non-existent subscriptions
      const minimalEntitlements: MerchantEntitlementDto = {
        merchantId,
        planId: subscriptionDetails?.planId || 'none',
        entitlements: {},
        // lastRefreshedAt: new Date(),
      };
       // Potentially populate with 'free' tier features if applicable
      await this.cacheService.setCachedEntitlements(merchantId, minimalEntitlements);
      return minimalEntitlements;
    }

    const entitlements: { [key in FeatureKey]?: IFeatureEntitlementDetails } = {};

    for (const planFeature of subscriptionDetails.features) {
      const featureDetails: IFeatureEntitlementDetails = {
        hasAccess: planFeature.isEnabled,
        limit: planFeature.limit,
        currentUsage: undefined,
        isGracePeriod: false, // To be determined below
        gracePeriodEndDate: undefined,
        reason: planFeature.isEnabled ? undefined : 'Feature not included in plan.',
      };

      if (planFeature.isEnabled && typeof planFeature.limit === 'number') {
        const usageProvider = this.findUsageProvider(planFeature.featureKey);
        if (usageProvider) {
          try {
            featureDetails.currentUsage = await usageProvider.getCurrentUsage(merchantId, planFeature.featureKey);
          } catch (error) {
            this.logger.error(
              `Failed to get current usage for ${planFeature.featureKey} from provider for merchant ${merchantId}`,
              error.stack,
            );
            // Decide how to handle: deny access, assume 0, or mark as error?
            // For now, let's assume it might affect access check later.
            featureDetails.reason = `Error fetching usage for ${planFeature.featureKey}.`;
          }
        } else {
          this.logger.warn(`No usage provider found for limit-based feature: ${planFeature.featureKey}`);
          featureDetails.reason = `Usage provider missing for ${planFeature.featureKey}.`;
        }
      }
      entitlements[planFeature.featureKey] = featureDetails;
    }

    const merchantEntitlementDto: MerchantEntitlementDto = {
      merchantId,
      planId: subscriptionDetails.planId,
      entitlements,
      // lastRefreshedAt: new Date(),
    };

    // Placeholder: Grace period logic would be applied here if a recent downgrade event
    // altered limits and currentUsage > newLimit. This state might be stored
    // temporarily (e.g., in cache with the entitlements, or a separate grace period record).
    // For this SDS, we assume it's part of the dynamic calculation or checked in canPerformAction.

    await this.cacheService.setCachedEntitlements(merchantId, merchantEntitlementDto);
    return merchantEntitlementDto;
  }

  async hasFeatureAccess(merchantId: string, featureKey: FeatureKey): Promise<boolean> {
    const entitlements = await this.getMerchantEntitlements(merchantId);
    const featureEntitlement = entitlements.entitlements[featureKey];
    return !!featureEntitlement?.hasAccess;
  }

  async checkUsageLimit(
    merchantId: string,
    featureKey: FeatureKey,
    currentUsage: number, // Caller provides current usage for this check
  ): Promise<FeatureAccessResponseDto> {
    const entitlements = await this.getMerchantEntitlements(merchantId);
    const featureEntitlement = entitlements.entitlements[featureKey];

    const response: FeatureAccessResponseDto = {
      featureKey,
      hasAccess: false,
      isWithinLimit: undefined,
      limit: undefined,
      currentUsage: undefined,
      isGracePeriod: false,
      gracePeriodEndDate: undefined,
    };

    if (!featureEntitlement || !featureEntitlement.hasAccess) {
      response.message = `Feature ${featureKey} is not available.`;
      response.errorCode = 'FEATURE_NOT_AVAILABLE';
      return response;
    }

    response.hasAccess = true;
    response.limit = featureEntitlement.limit;
    response.currentUsage = currentUsage; // Use caller-provided usage

    if (typeof featureEntitlement.limit !== 'number') {
      response.isWithinLimit = true; // No limit defined for this feature
      response.message = 'Access granted (no limit).';
      return response;
    }

    if (currentUsage <= featureEntitlement.limit) {
      response.isWithinLimit = true;
      response.message = 'Access granted (within limit).';
    } else {
      // Exceeded limit, check for grace period
      if (this.entitlementConfig.ENABLE_GRACE_PERIOD_FOR_DOWNGRADES && featureEntitlement.isGracePeriod) {
         // This assumes isGracePeriod and gracePeriodEndDate are correctly populated in getMerchantEntitlements
         // or through a more persistent grace period tracking mechanism.
        response.isWithinLimit = true; // Allowed due to grace period
        response.isGracePeriod = true;
        response.gracePeriodEndDate = featureEntitlement.gracePeriodEndDate;
        response.message = `Limit exceeded, but currently in grace period until ${featureEntitlement.gracePeriodEndDate?.toISOString()}.`;
      } else {
        response.isWithinLimit = false;
        response.message = `Usage limit of ${featureEntitlement.limit} for ${featureKey} exceeded. Current usage: ${currentUsage}.`;
        response.errorCode = 'LIMIT_EXCEEDED';
      }
    }
    return response;
  }


  async canPerformAction(
    merchantId: string,
    featureKey: FeatureKey,
    quantityToAdd: number = 1,
  ): Promise<FeatureAccessResponseDto> {
    const entitlements = await this.getMerchantEntitlements(merchantId);
    const featureEntitlement = entitlements.entitlements[featureKey];

    if (!featureEntitlement || !featureEntitlement.hasAccess) {
      throw new FeatureNotAvailableException(
        featureKey,
        `Feature ${featureKey} is not available under the current plan.`,
      );
    }

    const response: FeatureAccessResponseDto = {
      featureKey,
      hasAccess: true,
      isWithinLimit: true,
      limit: featureEntitlement.limit,
      currentUsage: featureEntitlement.currentUsage, // Usage from entitlements DTO
      requestedUsage: quantityToAdd,
      isGracePeriod: featureEntitlement.isGracePeriod,
      gracePeriodEndDate: featureEntitlement.gracePeriodEndDate,
    };

    // If feature has no limit, action is allowed
    if (typeof featureEntitlement.limit !== 'number') {
      response.message = 'Action allowed (feature has no specific limit).';
      return response;
    }

    // Recalculate current usage if not already fresh in DTO or if an external check is preferred
    // For simplicity, we use currentUsage from the DTO, assuming it's reasonably up-to-date.
    // A more robust check might re-fetch from UsageProvider here.
    let currentUsage = featureEntitlement.currentUsage;
    if (currentUsage === undefined) { // If not populated in DTO, fetch it
        const usageProvider = this.findUsageProvider(featureKey);
        if (usageProvider) {
            currentUsage = await usageProvider.getCurrentUsage(merchantId, featureKey);
            response.currentUsage = currentUsage; // Update response DTO
        } else {
            this.logger.warn(`Cannot determine current usage for ${featureKey} as no provider is found.`);
            // Depending on strictness, could throw error or assume 0.
            // For now, assume it's an issue if a limit exists but usage cannot be determined.
             throw new Error(`Configuration error: Usage provider missing for limited feature ${featureKey}.`);
        }
    }


    const potentialUsage = currentUsage + quantityToAdd;

    if (potentialUsage <= featureEntitlement.limit) {
      response.message = `Action allowed. Usage will be ${potentialUsage}/${featureEntitlement.limit}.`;
      return response;
    } else {
      // Potential usage exceeds limit
      if (this.entitlementConfig.ENABLE_GRACE_PERIOD_FOR_DOWNGRADES && featureEntitlement.isGracePeriod) {
        // Check if grace period rules allow *adding* more or just maintaining current over-limit usage
        // For simplicity, let's assume grace period allows *maintaining* existing over-limit usage
        // but *not* adding new items if it pushes further or if current is already at/above limit.
        // A more nuanced rule could be: if currentUsage < limit, allow up to limit.
        // If currentUsage >= limit, AND in grace period, disallow *further* increase.
        if (currentUsage >= featureEntitlement.limit && quantityToAdd > 0) {
             throw new EntitlementViolationException(
                featureKey,
                featureEntitlement.limit,
                currentUsage,
                quantityToAdd,
                `Action violates limit. Even in grace period, cannot add more items as current usage (${currentUsage}) already meets or exceeds the new limit (${featureEntitlement.limit}).`,
                'LIMIT_EXCEEDED_IN_GRACE_PERIOD',
             );
        }
        // If currentUsage < limit but potentialUsage > limit, then grace period logic applies
        // This case is complex. Simplification: If grace period is active, it's mostly for *existing* overages.
        // Let's assume the check `potentialUsage <= featureEntitlement.limit` is the primary gate,
        // and grace period helps interpret the `isWithinLimit` status but not necessarily allow new additions beyond the limit.
        // The SDS states: "grace period only allows existing usage, not adding more"
         throw new EntitlementViolationException(
            featureKey,
            featureEntitlement.limit,
            currentUsage,
            quantityToAdd,
            `Action violates limit for ${featureKey}. Limit: ${featureEntitlement.limit}, Current: ${currentUsage}, Requested: ${quantityToAdd}. In grace period, but new additions that exceed limit are not permitted.`,
            'LIMIT_EXCEEDED_GRACE_ACTION_DENIED',
          );
      }

      throw new EntitlementViolationException(
        featureKey,
        featureEntitlement.limit,
        currentUsage,
        quantityToAdd,
        `Action violates limit for ${featureKey}. Limit: ${featureEntitlement.limit}, Current: ${currentUsage}, Requested: ${quantityToAdd}.`,
        'LIMIT_EXCEEDED',
      );
    }
  }

  async handleSubscriptionChange(eventData: SubscriptionChangedEventDto): Promise<void> {
    this.logger.log(
      `Handling subscription change for merchant ${eventData.merchantId}: ${eventData.changeType} from ${eventData.oldPlanId} to ${eventData.newPlanId}`,
    );

    // Step 1: Clear existing cached entitlements
    await this.cacheService.clearCachedEntitlements(eventData.merchantId);
    this.logger.log(`Cleared cache for merchant ${eventData.merchantId} due to subscription change.`);

    // Step 2: Optionally, proactively fetch and cache new entitlements.
    // This can help in pre-calculating grace periods if needed immediately.
    const newEntitlements = await this.getMerchantEntitlements(eventData.merchantId);

    // Step 3: Handle specific logic for downgrades or cancellations
    if (eventData.changeType === 'DOWNGRADE') {
      this.logger.log(`Processing downgrade for merchant ${eventData.merchantId}.`);
      for (const key of Object.keys(newEntitlements.entitlements)) {
        const featureKey = key as FeatureKey;
        const details = newEntitlements.entitlements[featureKey];

        if (details && typeof details.limit === 'number' && typeof details.currentUsage === 'number' && details.currentUsage > details.limit) {
          this.logger.warn(
            `Merchant ${eventData.merchantId} exceeds new limit for ${featureKey} after downgrade. Limit: ${details.limit}, Usage: ${details.currentUsage}.`,
          );

          if (this.entitlementConfig.ENABLE_GRACE_PERIOD_FOR_DOWNGRADES) {
            const gracePeriodEnds = new Date(eventData.effectiveDate);
            gracePeriodEnds.setDate(gracePeriodEnds.getDate() + this.entitlementConfig.DOWNGRADE_GRACE_PERIOD_DAYS);

            // Update the cached entitlement with grace period information
            // This requires getMerchantEntitlements to be aware of recent downgrades or this method to update the cache directly.
            // For now, we'll log and assume the next getMerchantEntitlements would factor this in if state is persisted/passed.
            // A better way would be to store `gracePeriodEndDate` with the entitlement in cache.
            // Let's assume `getMerchantEntitlements` could derive this or it's set here and cached.
            // If `newEntitlements.entitlements[featureKey]` is mutable and `newEntitlements` is what gets cached:
            if (newEntitlements.entitlements[featureKey]) {
                newEntitlements.entitlements[featureKey].isGracePeriod = true;
                newEntitlements.entitlements[featureKey].gracePeriodEndDate = gracePeriodEnds;
                // Also update the reason or message
                 newEntitlements.entitlements[featureKey].reason = `Exceeds limit due to downgrade, in grace period until ${gracePeriodEnds.toISOString()}.`;
            }

            this.logger.log(
              `Merchant ${eventData.merchantId} is in grace period for ${featureKey} until ${gracePeriodEnds.toISOString()}.`,
            );
            // TODO: Optionally, send a notification to the merchant about the grace period.
            // This might involve calling a NotificationService.
          } else {
            this.logger.warn(
              `Grace period disabled. Merchant ${eventData.merchantId} immediately violates limit for ${featureKey}. Enforcement action may be needed.`,
            );
            // TODO: Trigger enforcement action (e.g., disable excess items).
            // This might involve calling a method on the relevant IMerchantUsageProvider or publishing another event.
            // Example: this.usageProviders.find(p => p.supportedFeatureKeys.includes(featureKey))?.enforceLimit(merchantId, featureKey, details.limit);
            // TODO: Optionally, send a notification to the merchant about immediate enforcement.
          }
        }
      }
       // Re-cache with updated grace period info if modified
      if (this.entitlementConfig.ENABLE_GRACE_PERIOD_FOR_DOWNGRADES) {
        await this.cacheService.setCachedEntitlements(eventData.merchantId, newEntitlements);
      }


    } else if (eventData.changeType === 'CANCELLED') {
      this.logger.log(`Subscription cancelled for merchant ${eventData.merchantId}. Entitlements will reflect minimal access.`);
      // Entitlements are already cleared and will be re-fetched as minimal by getMerchantEntitlements.
      // TODO: Trigger actions to disable all premium features or resources exceeding free tier limits, if applicable.
    }

    // For UPGRADE, REACTIVATED, PLAN_UPDATED, cache clearing is usually sufficient.
    // The next call to getMerchantEntitlements will fetch the new, likely more permissive, entitlements.
    this.logger.log(`Entitlement handling for subscription change for merchant ${eventData.merchantId} completed.`);
  }
}