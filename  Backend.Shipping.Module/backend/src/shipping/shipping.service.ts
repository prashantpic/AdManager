import { Injectable, Logger, InternalServerErrorException, NotFoundException, Inject } from '@nestjs/common';
import { ShippingRuleEngineService } from './rules/services/shipping-rule-engine.service';
import { IShippingProvider } from './core/interfaces/shipping-provider.interface';
import { ShippingRateQuoteModel } from './core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from './core/models/shipping-label.model';
import { TrackingDetailsModel } from './core/models/tracking-details.model';
import { RateRequestDto } from './providers/dto/rate-request.dto';
import { LabelGenerationRequestDto } from './providers/dto/label-generation-request.dto';
import { TrackingInfoRequestDto } from './providers/dto/tracking-info-request.dto';
import { CarrierCode } from './core/enums/carrier-code.enum';
import { ShippingConfigService } from './config/shipping-config.service';
import { FallbackShippingProvider } from './providers/fallback/fallback.provider';
import {
  ShippingRateUnavailableError,
  LabelGenerationFailedError,
  TrackingInfoUnavailableError,
  OperationNotSupportedError,
  ProviderConfigurationError,
} from './common/errors/shipping.errors';
import { CacheService } from '@admanager/backend.core.module';
import { CACHED_RATE_KEY_PREFIX, FALLBACK_RATE_ID_PREFIX } from './common/constants/shipping.constants';
import { ShipmentDetailsModel } from './core/models/shipment-details.model';
import { MerchantConfigModel } from './core/models/merchant-config.model';
import { ShippingRuleEntity } from './rules/entities/shipping-rule.entity';
import { ShippingRuleActionInterface } from './rules/interfaces/shipping-rule-action.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly providers: Map<CarrierCode, IShippingProvider>;

  constructor(
    private ruleEngineService: ShippingRuleEngineService,
    private configService: ShippingConfigService,
    private fallbackProvider: FallbackShippingProvider,
    @Inject(CarrierCode.FEDEX) private fedexProvider: IShippingProvider,
    @Inject(CarrierCode.UPS) private upsProvider: IShippingProvider,
    @Inject(CarrierCode.DHL) private dhlProvider: IShippingProvider,
    @Inject(CarrierCode.SHIPPO) private shippoProvider: IShippingProvider,
    @Inject(CacheService) private cacheService?: CacheService,
  ) {
    this.providers = new Map<CarrierCode, IShippingProvider>();
    if (this.configService.isProviderEnabled(CarrierCode.FEDEX)) this.registerProvider(this.fedexProvider);
    if (this.configService.isProviderEnabled(CarrierCode.UPS)) this.registerProvider(this.upsProvider);
    if (this.configService.isProviderEnabled(CarrierCode.DHL)) this.registerProvider(this.dhlProvider);
    if (this.configService.isProviderEnabled(CarrierCode.SHIPPO)) this.registerProvider(this.shippoProvider);
  }

  private registerProvider(provider: IShippingProvider): void {
    this.providers.set(provider.getProviderCode(), provider);
    this.logger.log(`Registered shipping provider: ${provider.getProviderCode()}`);
  }

  private async getMerchantProviderConfigs(merchantId: string): Promise<Map<CarrierCode, MerchantConfigModel>> {
    this.logger.warn(`Using mock getMerchantProviderConfigs for merchant ${merchantId}. Replace with actual implementation.`);
    const configs = new Map<CarrierCode, MerchantConfigModel>();
    const enabledProviders = this.configService.enabledProviders;

    for (const carrierCode of enabledProviders) {
      // Simulate fetching/constructing merchant-specific config for each enabled provider
      // This should ideally come from a persistent store or a dedicated merchant configuration service.
      // CredentialsRef should point to a secret in AWS Secrets Manager (or similar).
      // AccountNumber might be stored directly or also as a secret.
      // CustomProperties can hold any provider-specific settings.
      configs.set(carrierCode, {
        merchantId: merchantId,
        providerCode: carrierCode,
        credentialsRef: `SHIPPING_PROVIDER_API_KEY_${carrierCode}_REF`, // Convention for secret key
        accountNumber: `MERCHANT_${carrierCode}_ACCOUNT_ID_FROM_DB`, // Example, could also be a secret ref
        customProperties: {
          ...(carrierCode === CarrierCode.SHIPPO && { shippoCarrierAccountIds: [`shippo_acct_${merchantId}_1`] }), // Example for Shippo
        },
      });
    }
    return configs;
  }


  async getShippingRates(rateRequestDto: RateRequestDto): Promise<ShippingRateQuoteModel[]> {
    const { merchantId, shipmentDetails: originalShipmentDetails } = rateRequestDto;
    this.logger.log(`Calculating shipping rates for merchant ${merchantId}...`);

    const shipmentDetails = { ...originalShipmentDetails }; // Clone to modify
    if (!shipmentDetails.originAddress) {
        shipmentDetails.originAddress = this.configService.getDefaultOriginAddress();
        if (!shipmentDetails.originAddress) {
            this.logger.warn(`No origin address for merchant ${merchantId}, and no default. Rates may fail.`);
        }
    }

    const merchantProviderConfigs = await this.getMerchantProviderConfigs(merchantId);
    const matchingRules = await this.ruleEngineService.evaluateRules(merchantId, shipmentDetails);
    this.logger.debug(`Found ${matchingRules.length} matching shipping rules.`);

    let { applicableProviders, applicableServices, exclusiveRuleAction } = this.determineApplicableProvidersAndServices(matchingRules, merchantProviderConfigs);

    const ratePromises: Promise<ShippingRateQuoteModel[]>[] = [];
    for (const carrierCode of applicableProviders) {
      const provider = this.providers.get(carrierCode);
      const providerMerchantConfig = merchantProviderConfigs.get(carrierCode);
      if (provider && providerMerchantConfig) {
        ratePromises.push(
          provider.getRates(shipmentDetails, providerMerchantConfig)
            .catch(error => {
              this.logger.error(`Error fetching rates from ${carrierCode} for merchant ${merchantId}: ${error.message}`, error.stack);
              return [];
            }),
        );
      }
    }

    let allRates = (await Promise.all(ratePromises)).flat();
    this.logger.debug(`Received ${allRates.length} rates from providers for merchant ${merchantId}.`);

    let finalRates = this.applyRuleActionsToRates(allRates, matchingRules, exclusiveRuleAction, applicableServices);

    if (finalRates.length === 0) {
      this.logger.log(`No rates from providers/rules for merchant ${merchantId}. Using fallback.`);
      finalRates = await this.fallbackProvider.getRates(shipmentDetails, merchantProviderConfigs.values().next().value); // Pass any merchant config for context
      if (finalRates.length > 0) {
        this.logger.log(`Found ${finalRates.length} fallback rate(s) for merchant ${merchantId}.`);
      }
    }

    if (finalRates.length === 0) {
      throw new ShippingRateUnavailableError(`No shipping rates available for merchant ${merchantId}.`);
    }

    await this.tryCacheRates(shipmentDetails, finalRates, merchantId);
    this.logger.log(`Successfully calculated ${finalRates.length} final shipping rates for merchant ${merchantId}.`);
    return finalRates;
  }


  private determineApplicableProvidersAndServices(
    rules: ShippingRuleEntity[],
    merchantConfigs: Map<CarrierCode, MerchantConfigModel>,
  ): { applicableProviders: CarrierCode[]; applicableServices: Map<CarrierCode, string[] | undefined>; exclusiveRuleAction?: ShippingRuleActionInterface } {
    let applicableProviders: CarrierCode[] = [];
    const applicableServices = new Map<CarrierCode, string[] | undefined>();
    let exclusiveRuleAction: ShippingRuleActionInterface | undefined;

    for (const rule of rules) { // Rules are pre-sorted by priority
      if (exclusiveRuleAction) break; // If an exclusive rule was found, stop

      const action = rule.action;
      const ruleCarriers = action.carriers?.length ? action.carriers : this.configService.enabledProviders;

      if (action.isExclusive) {
        exclusiveRuleAction = action;
        applicableProviders = []; // Reset for exclusive rule
        applicableServices.clear();
      }

      for (const carrier of ruleCarriers) {
        if (this.configService.isProviderEnabled(carrier) && merchantConfigs.has(carrier)) {
          if (!applicableProviders.includes(carrier) || action.isExclusive) {
            applicableProviders.push(carrier);
          }
          // If action.services is empty/undefined, it means all services for that carrier.
          // If action.services has items, it specifies services.
          // An exclusive rule overrides previous non-exclusive service specifications.
          if (action.isExclusive || !applicableServices.has(carrier) || (action.services && action.services.length > 0)) {
             applicableServices.set(carrier, action.services && action.services.length > 0 ? [...action.services] : undefined);
          }
        }
      }
    }
    // If no rules matched or no exclusive rule found, default to all enabled and configured providers
    if (applicableProviders.length === 0 && !exclusiveRuleAction) {
        applicableProviders = this.configService.enabledProviders.filter(p => merchantConfigs.has(p));
        applicableProviders.forEach(p => applicableServices.set(p, undefined)); // All services
    }


    this.logger.debug(`Determined applicable providers: ${applicableProviders.join(', ')}`);
    if(exclusiveRuleAction) this.logger.debug('Exclusive rule applied.');
    return { applicableProviders: [...new Set(applicableProviders)], applicableServices, exclusiveRuleAction };
  }

  private applyRuleActionsToRates(
    rates: ShippingRateQuoteModel[],
    rules: ShippingRuleEntity[],
    exclusiveAction?: ShippingRuleActionInterface,
    applicableServices?: Map<CarrierCode, string[] | undefined>,
  ): ShippingRateQuoteModel[] {
    if (exclusiveAction) {
        // Filter by exclusive rule's carriers/services, then apply its action
        let filteredRates = rates.filter(rate =>
            (!exclusiveAction.carriers || exclusiveAction.carriers.includes(rate.carrierCode)) &&
            (!exclusiveAction.services || exclusiveAction.services.includes(rate.serviceCode))
        );
        return this.applySingleActionToRates(filteredRates, exclusiveAction);
    }

    // For non-exclusive, apply actions from highest priority matching rules
    // This can get complex if multiple rules modify the same rate.
    // Simplification: apply the action of the highest priority *applicable* rule to each rate.
    // A rate is applicable to a rule if the rule's carrier/service matches the rate.
    let modifiedRates = [...rates];
    for (const rule of rules) { // rules are sorted by priority
        if (rule.action.isExclusive) continue; // Already handled

        modifiedRates = modifiedRates.map(rate => {
            // Check if this rule applies to this rate's carrier/service
            const ruleAppliesToCarrier = !rule.action.carriers || rule.action.carriers.includes(rate.carrierCode);
            const ruleAppliesToService = !rule.action.services || rule.action.services.includes(rate.serviceCode);

            if (ruleAppliesToCarrier && ruleAppliesToService) {
                 // Apply this rule's action, then stop further modifications for this rate from lower priority rules.
                 // This is a simplification. A more complex system might aggregate adjustments.
                return this.applySingleActionToRates([rate], rule.action)[0] || rate; // Apply and return
            }
            return rate; // No change from this rule
        });
    }
    return modifiedRates;
  }

  private applySingleActionToRates(rates: ShippingRateQuoteModel[], action: ShippingRuleActionInterface): ShippingRateQuoteModel[] {
    return rates.map(rate => {
      const modifiedRate = { ...rate, id: uuidv4() }; // New ID for modified rate

      if (action.overrideAmount !== undefined && action.overrideCurrency === modifiedRate.currency) {
        modifiedRate.amount = action.overrideAmount;
        modifiedRate.serviceName += ' (Override)';
      } else if (action.overrideAmount !== undefined && action.overrideCurrency !== modifiedRate.currency) {
          this.logger.warn(`Rule override currency mismatch: Rate ${modifiedRate.currency}, Rule ${action.overrideCurrency}. Not applied.`);
      }


      if (action.costAdjustment) {
        if (action.costAdjustment.type === 'PERCENTAGE') {
          modifiedRate.amount *= (1 + action.costAdjustment.amount / 100);
        } else if (action.costAdjustment.type === 'FIXED' && modifiedRate.currency === action.costAdjustment.currency) {
          modifiedRate.amount += action.costAdjustment.amount;
        } else if (action.costAdjustment.type === 'FIXED' && modifiedRate.currency !== action.costAdjustment.currency) {
            this.logger.warn(`Rule fixed adjustment currency mismatch: Rate ${modifiedRate.currency}, Rule ${action.costAdjustment.currency}. Not applied.`);
        }
        modifiedRate.amount = Math.max(0, modifiedRate.amount); // No negative rates
      }

      if (action.overrideDeliveryDays !== undefined) {
        modifiedRate.deliveryDays = action.overrideDeliveryDays;
        delete modifiedRate.estimatedDeliveryDateMin;
        delete modifiedRate.estimatedDeliveryDateMax;
      }
      return modifiedRate;
    });
  }

  private async tryCacheRates(shipmentDetails: ShipmentDetailsModel, rates: ShippingRateQuoteModel[], merchantId: string): Promise<void> {
      if (this.configService.defaultFallbackMechanism === 'CACHED_RATES' && this.cacheService) {
          const cacheTTL = this.configService.fallbackCacheTTLinSeconds;
          if (cacheTTL && cacheTTL > 0 && rates.length > 0) {
              const keyPart = Buffer.from(JSON.stringify({ // Create a more stable key
                  orig: shipmentDetails.originAddress,
                  dest: shipmentDetails.destinationAddress,
                  parcels: shipmentDetails.parcels.map(p => ({ w: p.weight, l: p.length, wi: p.width, h: p.height })),
                  val: shipmentDetails.totalOrderValue,
                  cur: shipmentDetails.currency,
              })).toString('base64');
              const cacheKey = `${CACHED_RATE_KEY_PREFIX}${merchantId}:${keyPart}`;
              try {
                  await this.cacheService.set(cacheKey, JSON.stringify(rates), cacheTTL);
                  this.logger.debug(`Cached ${rates.length} rates for merchant ${merchantId} with key ${cacheKey}`);
              } catch (e) {
                  this.logger.error(`Failed to cache rates for merchant ${merchantId}: ${e.message}`);
              }
          }
      }
  }

  async generateShippingLabel(labelRequestDto: LabelGenerationRequestDto): Promise<ShippingLabelModel> {
    const { merchantId, shipmentDetails, selectedRateId } = labelRequestDto;
    this.logger.log(`Generating shipping label for merchant ${merchantId}, rate ID ${selectedRateId}...`);

    // Step 1: Retrieve selected rate details (this is crucial and complex)
    // For robust implementation, getShippingRates should return IDs that allow easy retrieval
    // of provider-specific rate data (e.g., from cache or temporary store).
    // Simplification: assume selectedRateId directly maps to cached full ShippingRateQuoteModel.
    const rateCacheKey = `${CACHED_RATE_KEY_PREFIX}rate:${merchantId}:${selectedRateId}`; // Example key for a single rate quote
    let selectedRate: ShippingRateQuoteModel | undefined;
    try {
        const cachedRateJson = await this.cacheService?.get(rateCacheKey);
        if (cachedRateJson) {
            selectedRate = JSON.parse(cachedRateJson);
            this.logger.debug(`Retrieved selected rate ${selectedRateId} from cache for label generation.`);
        }
    } catch (e) {
        this.logger.error(`Error retrieving rate ${selectedRateId} from cache: ${e.message}`);
    }

    if (!selectedRate) {
      throw new NotFoundException(`Selected shipping rate ID ${selectedRateId} not found or expired.`);
    }
    if (selectedRate.carrierCode === CarrierCode.FALLBACK) {
      throw new OperationNotSupportedError('Label generation', CarrierCode.FALLBACK);
    }

    const provider = this.providers.get(selectedRate.carrierCode);
    if (!provider) {
      throw new InternalServerErrorException(`Provider for carrier ${selectedRate.carrierCode} not found.`);
    }

    const merchantProviderConfigs = await this.getMerchantProviderConfigs(merchantId);
    const providerMerchantConfig = merchantProviderConfigs.get(selectedRate.carrierCode);
    if (!providerMerchantConfig) {
      throw new ProviderConfigurationError(selectedRate.carrierCode, `Merchant config for ${selectedRate.carrierCode}`);
    }

    try {
      const label = await provider.createLabel(shipmentDetails, selectedRateId, providerMerchantConfig); // Pass selectedRateId (or original rate object from selectedRate.originalProviderRate)
      this.logger.log(`Label generated for merchant ${merchantId}, tracking: ${label.trackingNumber}`);
      return label;
    } catch (error) {
      this.logger.error(`Label generation failed for merchant ${merchantId} with ${selectedRate.carrierCode}: ${error.message}`, error.stack);
      if (error instanceof OperationNotSupportedError || error instanceof ProviderConfigurationError) throw error;
      throw new LabelGenerationFailedError(error.message);
    }
  }

  async getTrackingInfo(trackingInfoRequestDto: TrackingInfoRequestDto): Promise<TrackingDetailsModel> {
    const { merchantId, trackingNumber, carrierCode: hint } = trackingInfoRequestDto;
    this.logger.log(`Fetching tracking for ${trackingNumber}, merchant ${merchantId}, hint: ${hint || 'none'}`);

    const merchantProviderConfigs = await this.getMerchantProviderConfigs(merchantId);
    const providersToTry: { provider: IShippingProvider, config: MerchantConfigModel }[] = [];

    if (hint && this.providers.has(hint) && merchantProviderConfigs.has(hint)) {
      providersToTry.push({ provider: this.providers.get(hint)!, config: merchantProviderConfigs.get(hint)! });
    } else {
      // Try all configured and enabled providers if no valid hint
      this.providers.forEach((provider, code) => {
        if (provider.getProviderCode() !== CarrierCode.FALLBACK && merchantProviderConfigs.has(code)) {
          providersToTry.push({ provider, config: merchantProviderConfigs.get(code)! });
        }
      });
    }

    if (providersToTry.length === 0) {
      throw new TrackingInfoUnavailableError(`No configured providers to track ${trackingNumber}.`);
    }

    for (const { provider, config } of providersToTry) {
      try {
        const details = await provider.getTrackingDetails(trackingNumber, config);
        if (details) { // Provider found info
          this.logger.log(`Tracking info for ${trackingNumber} found via ${provider.getProviderCode()}`);
          return details;
        }
      } catch (error) {
        this.logger.warn(`Tracking attempt for ${trackingNumber} via ${provider.getProviderCode()} failed: ${error.message}`);
        // Continue to next provider
      }
    }

    throw new TrackingInfoUnavailableError(`Tracking information for ${trackingNumber} not found with any provider.`);
  }
}