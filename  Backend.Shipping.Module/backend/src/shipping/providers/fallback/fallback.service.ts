import { Injectable, Logger } from '@nestjs/common';
import { ShippingConfigService } from '../../config/shipping-config.service';
import { CacheService } from '@admanager/backend.core.module'; // Assuming Core module export
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { MerchantConfigModel } from '../../core/models/merchant-config.model';
import { FallbackMechanism } from '../../core/enums/fallback-mechanism.enum';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { FALLBACK_RATE_ID_PREFIX, CACHED_RATE_KEY_PREFIX } from '../../common/constants/shipping.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FallbackShippingService {
  private readonly logger = new Logger(FallbackShippingService.name);

  constructor(
    private configService: ShippingConfigService,
    // CacheService is optional - only injected if caching is enabled/configured in CoreModule
    private cacheService?: CacheService,
  ) {}

  /**
   * Determines and returns fallback shipping rates based on configuration.
   * @param shipmentDetails Details of the shipment.
   * @param merchantConfig Merchant's configuration (used implicitly via configService).
   * @returns A promise resolving to an array of fallback rate quotes (usually 0 or 1).
   */
  async getFallbackRates(
    shipmentDetails: ShipmentDetailsModel,
    merchantConfig: MerchantConfigModel, // Merchant config might influence fallback logic in future
  ): Promise<ShippingRateQuoteModel[]> {
    this.logger.debug(`Determining fallback rates for merchant ${merchantConfig.merchantId}...`);

    const fallbackMechanism = this.configService.defaultFallbackMechanism;

    switch (fallbackMechanism) {
      case FallbackMechanism.FLAT_RATE:
        const flatRateAmount = this.configService.fallbackFlatRateAmount;
        const flatRateCurrency = this.configService.fallbackFlatRateCurrency;
        if (flatRateAmount !== undefined && flatRateCurrency) {
          this.logger.debug(`Using FLAT_RATE fallback: ${flatRateAmount} ${flatRateCurrency}`);
          const fallbackRate = new ShippingRateQuoteModel();
          fallbackRate.id = `${FALLBACK_RATE_ID_PREFIX}${uuidv4()}`; // Unique ID for this quote instance
          fallbackRate.carrierCode = CarrierCode.FALLBACK;
          fallbackRate.serviceCode = 'FLAT_RATE';
          fallbackRate.serviceName = 'Flat Rate Shipping';
          fallbackRate.amount = flatRateAmount;
          fallbackRate.currency = flatRateCurrency;
          fallbackRate.description = 'This is a fallback flat rate.';
          return [fallbackRate];
        } else {
          this.logger.warn('FLAT_RATE fallback is enabled but amount or currency is not configured.');
          return []; // No fallback rate available due to missing config
        }

      case FallbackMechanism.CACHED_RATES:
        const cacheTTL = this.configService.fallbackCacheTTLinSeconds;
        if (this.cacheService && cacheTTL && cacheTTL > 0) {
          this.logger.debug(`Attempting CACHED_RATES fallback with TTL ${cacheTTL}s.`);
          // Generate a cache key based on shipment details (need a consistent way to hash/serialize)
          // For simplicity, let's use a basic hash or serialization of key shipment properties.
          // A robust solution would use a canonical representation of shipmentDetails.
          const shipmentHash = this.generateShipmentDetailsHash(shipmentDetails);
          const cacheKey = `${CACHED_RATE_KEY_PREFIX}${shipmentHash}`;

          try {
             const cachedRatesJson = await this.cacheService.get(cacheKey);
             if (cachedRatesJson) {
                 const cachedRates = JSON.parse(cachedRatesJson) as ShippingRateQuoteModel[];
                 this.logger.debug(`Found ${cachedRates.length} cached rates for fallback.`);
                 // Assign new unique IDs for the current request context
                 cachedRates.forEach(rate => {
                      rate.id = `${FALLBACK_RATE_ID_PREFIX}${uuidv4()}`;
                      rate.carrierCode = CarrierCode.FALLBACK; // Mark as fallback rate
                      rate.serviceName = rate.serviceName + ' (Cached)'; // Indicate it's cached
                 });
                 return cachedRates;
             } else {
                 this.logger.debug('No cached rates found.');
                 return [];
             }
          } catch (cacheError) {
               this.logger.error(`Error retrieving cached rates: ${cacheError.message}`);
               return []; // Treat cache errors as no cached rates available
          }

        } else {
          this.logger.warn('CACHED_RATES fallback is enabled but CacheService is not available or TTL is not configured.');
          return []; // No fallback rate available
        }

      case FallbackMechanism.DISABLED:
      default:
        this.logger.debug('Fallback mechanism is DISABLED.');
        return []; // No fallback rates
    }
  }

   /**
    * Placeholder for generating a consistent hash/key from shipment details for caching.
    * A real implementation needs to handle complex objects and potentially sensitive data (though sensitive data shouldn't be in cache key).
    * @param details Shipment details.
    * @returns A string key suitable for caching.
    */
   private generateShipmentDetailsHash(details: ShipmentDetailsModel): string {
       // WARNING: This is a simplistic placeholder. A proper implementation should
       // create a canonical JSON string or hash of the *relevant* properties (origin, dest, parcels, value, currency).
       // JSON.stringify order isn't guaranteed across environments/TS versions without sorting keys.
       const canonicalData = {
           origin: details.originAddress,
           destination: details.destinationAddress,
           parcels: details.parcels,
           totalOrderValue: details.totalOrderValue,
           currency: details.currency,
           // Include relevant line item properties if they influence rules/rates significantly
           lineItemsSummary: details.lineItems.map(item => ({
               sku: item.sku, quantity: item.quantity, unitPrice: item.unitPrice,
           })),
       };
       // Use a hashing library like 'object-hash' for robustness if needed
       try {
           // Simplistic approach, potentially non-deterministic across platforms
           return JSON.stringify(canonicalData);
       } catch (e) {
            this.logger.error('Failed to generate shipment details hash for caching.', e);
            return 'error_generating_hash'; // Fallback to avoid breaking
       }
   }
}