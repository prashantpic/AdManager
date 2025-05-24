import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IAppRepository,
  IAppInstallationRepository,
  IAppMerchantSubscriptionRepository,
  AppMerchantSubscriptionEntity,
} from '../../domain';
import { PlatformBillingClient } from '../../infrastructure/clients'; // ACL
// import { EntitlementClient } from '../../infrastructure/clients'; // Conceptual
import { SubscribeAppDto, UnsubscribeAppDto, AppMerchantSubscriptionDto } from '../dtos';
import { AppMerchantSubscriptionMapper } from '../mappers/app-merchant-subscription.mapper';
import { AppPricingModel } from '../../common/enums';
import { AppOperationException } from '../../common/exceptions';

interface EntitlementClient { // Placeholder
    updateEntitlementsForSubscription(merchantId: string, appId: string, subscriptionStatus: string): Promise<void>;
}

@Injectable()
export class AppSubscriptionManagementService {
  constructor(
    @Inject('IAppRepository')
    private readonly appRepository: IAppRepository,
    @Inject('IAppInstallationRepository')
    private readonly appInstallationRepository: IAppInstallationRepository,
    @Inject('IAppMerchantSubscriptionRepository')
    private readonly appMerchantSubscriptionRepository: IAppMerchantSubscriptionRepository,
    private readonly platformBillingClient: PlatformBillingClient,
    // @Inject('EntitlementClient') private readonly entitlementClient: EntitlementClient, // Placeholder
    private readonly appMerchantSubscriptionMapper: AppMerchantSubscriptionMapper,
  ) {}

  async subscribeToApp(
    merchantId: string,
    installationId: string, // Link subscription to an installation
    dto: SubscribeAppDto,
  ): Promise<AppMerchantSubscriptionDto> {
    // REQ-8-009, REQ-8-010
    const installation = await this.appInstallationRepository.findByIdAndMerchantId(installationId, merchantId);
    if (!installation) {
        throw new NotFoundException(`App installation with ID "${installationId}" not found for this merchant.`);
    }
    if (installation.appId !== dto.appId) {
        throw new BadRequestException(`App ID in DTO (${dto.appId}) does not match installation's app ID (${installation.appId}).`);
    }

    const app = await this.appRepository.findById(dto.appId);
    if (!app) {
      throw new NotFoundException(`App with ID "${dto.appId}" not found.`);
    }
    if (app.pricingModel === AppPricingModel.FREE) {
      throw new BadRequestException(`App "${app.name}" is free and does not require a subscription.`);
    }

    const existingSubscription = await this.appMerchantSubscriptionRepository.findActiveByInstallationId(installationId);
    if (existingSubscription) {
      throw new AppOperationException(`An active subscription already exists for this app installation.`);
    }

    // Call PlatformBillingClient to create subscription and handle payment
    const billingSubscriptionDetails = {
      merchantId,
      appId: app.id,
      appName: app.name,
      pricingModel: app.pricingModel,
      amount: app.pricingDetails.amount, // Assuming pricingDetails VO is populated
      currency: app.pricingDetails.currency,
      billingCycle: dto.billingCycle || app.pricingDetails.billingCycle, // DTO can override app default
      trialDays: app.pricingDetails.trialDays,
    };

    const billingResponse = await this.platformBillingClient.createAppSubscription(billingSubscriptionDetails);
    if (!billingResponse || !billingResponse.externalSubscriptionId) {
      throw new AppOperationException(`Failed to create subscription with billing provider for app "${app.name}".`);
    }

    const subscriptionEntity = new AppMerchantSubscriptionEntity();
    subscriptionEntity.installationId = installationId;
    subscriptionEntity.installation = installation;
    subscriptionEntity.appId = app.id;
    subscriptionEntity.app = app;
    subscriptionEntity.merchantId = merchantId;
    subscriptionEntity.status = billingResponse.status; // e.g., 'active', 'trialing'
    subscriptionEntity.pricingModel = app.pricingModel;
    subscriptionEntity.amount = billingSubscriptionDetails.amount;
    subscriptionEntity.currency = billingSubscriptionDetails.currency;
    subscriptionEntity.billingCycle = billingSubscriptionDetails.billingCycle;
    subscriptionEntity.startDate = new Date(billingResponse.startDate);
    subscriptionEntity.endDate = billingResponse.endDate ? new Date(billingResponse.endDate) : null;
    subscriptionEntity.trialEndDate = billingResponse.trialEndDate ? new Date(billingResponse.trialEndDate) : null;
    subscriptionEntity.renewalDate = billingResponse.renewalDate ? new Date(billingResponse.renewalDate) : null;
    subscriptionEntity.externalSubscriptionId = billingResponse.externalSubscriptionId;

    const savedSubscription = await this.appMerchantSubscriptionRepository.save(subscriptionEntity);
    
    // Update entitlements (conceptual)
    // await this.entitlementClient.updateEntitlementsForSubscription(merchantId, app.id, savedSubscription.status);

    return this.appMerchantSubscriptionMapper.toDto(savedSubscription);
  }

  async unsubscribeFromApp(merchantId: string, subscriptionId: string): Promise<void> {
    // REQ-8-009
    const subscription = await this.appMerchantSubscriptionRepository.findByIdAndMerchantId(subscriptionId, merchantId);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${subscriptionId}" not found for this merchant.`);
    }
    if (subscription.status === 'cancelled') {
        throw new AppOperationException('Subscription is already cancelled.');
    }

    await this.platformBillingClient.cancelAppSubscription(subscription.externalSubscriptionId);

    subscription.status = 'cancelled';
    subscription.endDate = new Date(); // Or effective cancellation date from billing client
    await this.appMerchantSubscriptionRepository.save(subscription);

    // Update entitlements (conceptual)
    // await this.entitlementClient.updateEntitlementsForSubscription(merchantId, subscription.appId, subscription.status);
  }

  async getMerchantSubscriptions(merchantId: string): Promise<AppMerchantSubscriptionDto[]> {
    // REQ-8-009
    const subscriptions = await this.appMerchantSubscriptionRepository.findByMerchantId(merchantId);
    return subscriptions.map(sub => this.appMerchantSubscriptionMapper.toDto(sub));
  }

  async getMerchantSubscriptionDetails(merchantId: string, subscriptionId: string): Promise<AppMerchantSubscriptionDto | null> {
    const subscription = await this.appMerchantSubscriptionRepository.findByIdAndMerchantId(subscriptionId, merchantId);
    if (!subscription) {
        throw new NotFoundException(`Subscription with ID "${subscriptionId}" not found.`);
    }
    return this.appMerchantSubscriptionMapper.toDto(subscription);
  }

  // Potentially a method to handle webhook events from PlatformBillingClient for subscription updates (renewals, payment failures)
  async handleSubscriptionWebhook(payload: any): Promise<void> {
    const externalSubscriptionId = payload.externalSubscriptionId;
    const newStatus = payload.status;
    // ... logic to find AppMerchantSubscriptionEntity by externalSubscriptionId and update its status, dates etc.
    // ... call entitlementClient if status changes affect features
  }
}