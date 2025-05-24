import { registerAs } from '@nestjs/config';
import { IShippingConfig } from './shipping-config.interface';
import { FallbackMechanism } from '../core/enums/fallback-mechanism.enum';
import { CarrierCode } from '../core/enums/carrier-code.enum';
import { DEFAULT_SHIPPING_TIMEOUT_MS } from '../common/constants/shipping.constants';

export default registerAs(
  'shipping',
  (): IShippingConfig => {
    const providerTimeout = (carrierEnvVarSuffix: string): number => {
      const envVar = process.env[`SHIPPING_PROVIDER_TIMEOUT_MS_${carrierEnvVarSuffix}`];
      return envVar ? parseInt(envVar, 10) : DEFAULT_SHIPPING_TIMEOUT_MS;
    };

    const enabledProvidersEnv = process.env.SHIPPING_ENABLED_PROVIDERS;
    const enabledProviders: CarrierCode[] = enabledProvidersEnv
      ? (enabledProvidersEnv.split(',') as CarrierCode[]).filter(
          (p): p is CarrierCode => Object.values(CarrierCode).includes(p as CarrierCode) && p !== CarrierCode.FALLBACK,
        )
      : [CarrierCode.FEDEX, CarrierCode.UPS, CarrierCode.DHL, CarrierCode.SHIPPO]; // Default enabled if not set

    return {
      defaultFallbackMechanism:
        (process.env.DEFAULT_FALLBACK_MECHANISM as FallbackMechanism) ||
        FallbackMechanism.DISABLED,
      fallbackFlatRateAmount: process.env.DEFAULT_FALLBACK_FLAT_RATE_AMOUNT
        ? parseFloat(process.env.DEFAULT_FALLBACK_FLAT_RATE_AMOUNT)
        : undefined,
      fallbackFlatRateCurrency:
        process.env.DEFAULT_FALLBACK_FLAT_RATE_CURRENCY || 'USD',
      fallbackCacheTTLinSeconds: process.env.DEFAULT_FALLBACK_CACHE_TTL_SECONDS
        ? parseInt(process.env.DEFAULT_FALLBACK_CACHE_TTL_SECONDS, 10)
        : undefined,
      providerTimeoutsInMs: {
        [CarrierCode.FEDEX]: providerTimeout('FEDEX'),
        [CarrierCode.UPS]: providerTimeout('UPS'),
        [CarrierCode.DHL]: providerTimeout('DHL'),
        [CarrierCode.SHIPPO]: providerTimeout('SHIPPO'),
      },
      enabledProviders,
      providerApiUrls: {
        [CarrierCode.FEDEX]: process.env.SHIPPING_FEDEX_API_ENDPOINT,
        [CarrierCode.UPS]: process.env.SHIPPING_UPS_API_ENDPOINT,
        [CarrierCode.DHL]: process.env.SHIPPING_DHL_API_ENDPOINT,
        [CarrierCode.SHIPPO]: process.env.SHIPPING_SHIPPO_API_ENDPOINT,
      },
      defaultOriginAddress: process.env.DEFAULT_SHIPPING_ORIGIN_POSTAL_CODE // Check one key field
        ? {
            street1: process.env.DEFAULT_SHIPPING_ORIGIN_STREET1 || '123 Default St',
            street2: process.env.DEFAULT_SHIPPING_ORIGIN_STREET2,
            city: process.env.DEFAULT_SHIPPING_ORIGIN_CITY || 'Default City',
            stateProvince: process.env.DEFAULT_SHIPPING_ORIGIN_STATE || 'CA',
            postalCode: process.env.DEFAULT_SHIPPING_ORIGIN_POSTAL_CODE || '90210',
            countryCode: process.env.DEFAULT_SHIPPING_ORIGIN_COUNTRY_CODE || 'US',
            companyName: process.env.DEFAULT_SHIPPING_ORIGIN_COMPANY,
            contactName: process.env.DEFAULT_SHIPPING_ORIGIN_CONTACT,
            phoneNumber: process.env.DEFAULT_SHIPPING_ORIGIN_PHONE,
            isResidential: process.env.DEFAULT_SHIPPING_ORIGIN_RESIDENTIAL === 'true',
          }
        : undefined,
    };
  },
);