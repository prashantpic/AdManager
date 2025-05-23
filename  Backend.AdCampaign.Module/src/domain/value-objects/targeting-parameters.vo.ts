import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception';

// Example structures for nested targeting options
interface DemographicsTargeting {
  ageRange?: [number, number];
  genders?: string[]; // e.g., ['MALE', 'FEMALE', 'NON_BINARY']
}

interface LocationTargeting {
  countries?: string[]; // ISO 3166-1 alpha-2 codes
  regions?: string[]; // e.g., state/province codes
  cities?: string[];
  zipCodes?: string[];
  radius?: { latitude: number; longitude: number; distance: number; unit: 'KM' | 'MI' };
}

interface DeviceTargeting {
  operatingSystems?: string[]; // e.g., ['IOS', 'ANDROID']
  models?: string[];
  connectionTypes?: string[]; // e.g., ['WIFI', 'CELLULAR']
}

export class TargetingParameters {
  public readonly demographics?: DemographicsTargeting;
  public readonly interests?: string[];
  public readonly behaviors?: string[];
  public readonly customAudienceIds?: string[]; // IDs referencing pre-defined custom audiences
  public readonly lookalikeAudienceIds?: string[]; // IDs referencing pre-defined lookalike audiences
  public readonly locations?: LocationTargeting;
  public readonly devices?: DeviceTargeting;
  public readonly productIds?: string[]; // For targeting specific products (e.g., retargeting)
  public readonly promotionIds?: string[]; // For targeting based on promotions

  constructor(params: {
    demographics?: DemographicsTargeting;
    interests?: string[];
    behaviors?: string[];
    customAudienceIds?: string[];
    lookalikeAudienceIds?: string[];
    locations?: LocationTargeting;
    devices?: DeviceTargeting;
    productIds?: string[];
    promotionIds?: string[];
  }) {
    // Basic validation: ensure at least one targeting parameter is provided if object is created.
    // More complex validation (e.g., valid interest IDs, location formats) would typically
    // involve external data or more sophisticated validation logic, potentially in a domain service.
    if (Object.keys(params).length === 0) {
      throw new ArgumentInvalidException('Targeting parameters cannot be empty if specified.');
    }

    // Example validation for age range
    if (params.demographics?.ageRange && params.demographics.ageRange[0] > params.demographics.ageRange[1]) {
        throw new ArgumentInvalidException('Invalid age range in demographics targeting.');
    }

    this.demographics = params.demographics ? Object.freeze(params.demographics) : undefined;
    this.interests = params.interests ? Object.freeze([...params.interests]) : undefined;
    this.behaviors = params.behaviors ? Object.freeze([...params.behaviors]) : undefined;
    this.customAudienceIds = params.customAudienceIds ? Object.freeze([...params.customAudienceIds]) : undefined;
    this.lookalikeAudienceIds = params.lookalikeAudienceIds ? Object.freeze([...params.lookalikeAudienceIds]) : undefined;
    this.locations = params.locations ? Object.freeze(params.locations) : undefined;
    this.devices = params.devices ? Object.freeze(params.devices) : undefined;
    this.productIds = params.productIds ? Object.freeze([...params.productIds]) : undefined;
    this.promotionIds = params.promotionIds ? Object.freeze([...params.promotionIds]) : undefined;
  }

  // Getter methods can be added
}