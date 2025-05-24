import { FallbackMechanism } from '../core/enums/fallback-mechanism.enum';
import { CarrierCode } from '../core/enums/carrier-code.enum';
import { AddressModel } from '../core/models/address.model';

export interface IShippingConfig {
  /**
   * Default fallback mechanism if no rules match or providers fail.
   */
  defaultFallbackMechanism: FallbackMechanism;

  /**
   * Amount for FLAT_RATE fallback, if enabled.
   */
  fallbackFlatRateAmount?: number;

  /**
   * Currency for FLAT_RATE fallback.
   */
  fallbackFlatRateCurrency?: string;

  /**
   * TTL in seconds for CACHED_RATES fallback, if enabled.
   */
  fallbackCacheTTLinSeconds?: number;

  /**
   * Timeout in milliseconds for calls to specific shipping provider APIs.
   */
  providerTimeoutsInMs: {
    [key in CarrierCode]?: number; // Allows indexing by any CarrierCode
  };

  /**
   * Feature flags to enable/disable specific providers globally.
   * Fallback is not explicitly listed here as it's controlled by defaultFallbackMechanism.
   */
  enabledProviders: CarrierCode[];

  /**
   * Base URL overrides for providers.
   * If a provider's URL is not specified here, a default (e.g., from the provider class or hardcoded) will be used.
   */
  providerApiUrls?: {
    [key in CarrierCode]?: string;
  };

  /**
   * Default origin address for rate calculations if not provided in shipment details.
   * This structure should match the AddressModel.
   */
  defaultOriginAddress?: {
    street1: string;
    street2?: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    countryCode: string;
    companyName?: string;
    contactName?: string;
    phoneNumber?: string;
    isResidential?: boolean;
  };
}