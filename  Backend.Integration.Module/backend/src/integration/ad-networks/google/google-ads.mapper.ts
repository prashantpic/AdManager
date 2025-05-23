```typescript
import { Injectable } from '@nestjs/common';
// import { DataMapperUtil } from '../../common/utils/data-mapper.util'; // Assume exists

// Placeholder for DataMapperUtil
@Injectable()
export class DataMapperUtil {
  // Example utility, actual implementation in its own file
  public toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }
  public toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }
  public transformKeys(obj: any, keyMap: Record<string, string>): any {
    // Basic key transformation logic
    if (typeof obj !== 'object' || obj === null) return obj;
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[keyMap[key] || key] = obj[key];
      }
    }
    return newObj;
  }
}


// Placeholder DTOs - these should be defined in appropriate DTO directories
export interface PlatformCampaignDto {
  id?: string;
  name: string;
  status: string; // e.g., 'ACTIVE', 'PAUSED'
  budgetId?: string; // platform specific
  // ... other common campaign properties
}

export interface CampaignPerformanceDto {
  campaignId: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions?: number;
  roas?: number;
  // ... other common performance metrics
}

export interface ProductCatalogItemDto {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  price: string; // e.g., "10.99 USD"
  // ... other common product properties
}

// Example Google Ads specific request/response structures (simplified)
export interface GoogleAdsCampaignRequest {
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  campaign_budget?: string; // resource name of a budget
  // ... other Google Ads campaign fields
}

export interface GoogleAdsPerformanceReportRow {
  metrics: {
    impressions: string; // Typically numbers as strings from API
    clicks: string;
    cost_micros: string; // Cost in micro-currency unit
    conversions?: string;
  };
  campaign: {
    resource_name: string; // e.g. customers/{customer_id}/campaigns/{campaign_id}
  };
  // ... other dimensions
}

export interface GoogleAdsProductFeedItem {
    offer_id: string;
    title: string;
    description: string;
    link: string;
    image_link: string;
    price: {
        value: string; // e.g., "10.99"
        currency: string; // e.g., "USD"
    };
    // ... other Google Shopping feed attributes
}


@Injectable()
export class GoogleAdsMapper {
  constructor(private readonly dataMapperUtil: DataMapperUtil) {}

  public toGoogleCampaignFormat(platformCampaign: PlatformCampaignDto): GoogleAdsCampaignRequest {
    // Example mapping
    const googleStatusMap = {
      ACTIVE: 'ENABLED',
      PAUSED: 'PAUSED',
      REMOVED: 'REMOVED', // Assuming platform uses 'REMOVED'
    };

    return {
      name: platformCampaign.name,
      status: googleStatusMap[platformCampaign.status.toUpperCase()] as GoogleAdsCampaignRequest['status'] || 'PAUSED',
      campaign_budget: platformCampaign.budgetId, // This needs to be a Google Ads budget resource name
      // ... map other fields
    };
  }

  public fromGoogleCampaignPerformance(googlePerformanceReportRow: GoogleAdsPerformanceReportRow): CampaignPerformanceDto {
    // Example mapping
    const campaignId = googlePerformanceReportRow.campaign.resource_name.split('/').pop()!;
    return {
      campaignId: campaignId,
      impressions: parseInt(googlePerformanceReportRow.metrics.impressions, 10),
      clicks: parseInt(googlePerformanceReportRow.metrics.clicks, 10),
      cost: parseInt(googlePerformanceReportRow.metrics.cost_micros, 10) / 1000000, // Convert micros to standard currency unit
      conversions: googlePerformanceReportRow.metrics.conversions ? parseInt(googlePerformanceReportRow.metrics.conversions, 10) : undefined,
      // roas: calculate ROAS if data is available
      // ... map other fields
    };
  }

  public toGoogleProductFeedItem(productItem: ProductCatalogItemDto): GoogleAdsProductFeedItem {
    // Example mapping
    const [priceValue, currencyCode] = productItem.price.split(' ');
    return {
      offer_id: productItem.id,
      title: productItem.title,
      description: productItem.description,
      link: productItem.link,
      image_link: productItem.imageLink,
      price: {
        value: priceValue,
        currency: currencyCode,
      },
      // ... map other fields using dataMapperUtil if needed for case conversion etc.
    };
  }
}
```