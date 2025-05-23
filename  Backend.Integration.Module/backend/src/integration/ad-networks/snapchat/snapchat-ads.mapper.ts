```typescript
import { Injectable } from '@nestjs/common';
// import { DataMapperUtil } from '../../common/utils/data-mapper.util';

@Injectable()
export class SnapchatAdsMapper {
  // constructor(private readonly dataMapperUtil: DataMapperUtil) {}
  constructor() {}

  // Example: Map platform campaign DTO to Snapchat Ads campaign creation parameters
  public toSnapchatCampaignFormat(platformCampaign: any /* PlatformCampaignDto */): any {
    return {
      ad_account_id: "YOUR_AD_ACCOUNT_ID", // This would typically come from merchant's config
      name: platformCampaign.name,
      objective: "PIXEL_PURCHASE", // Example
      status: platformCampaign.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
      // ... other Snapchat specific fields
    };
  }

  // Example: Map Snapchat Ads performance data to platform DTO
  public fromSnapchatCampaignPerformance(snapchatPerformanceData: any): any /* CampaignPerformanceDto */ {
    return {
      campaignId: snapchatPerformanceData.id, // Assuming 'id' is the campaign ID
      impressions: parseInt(snapchatPerformanceData.impressions, 10),
      swipes: parseInt(snapchatPerformanceData.swipes, 10), // Snapchat uses 'swipes' for clicks
      cost: parseFloat(snapchatPerformanceData.spend_decimal_currency) / 1000000, // Spend in micro_currency
      // ...
    };
  }

  // Example: Map platform product item to Snapchat catalog item format
  public toSnapchatProductFeedItem(productItem: any /* ProductCatalogItemDto */): any {
    return {
      id: productItem.id, // Snapchat usually calls this 'retailer_id' or similar
      title: productItem.title,
      description: productItem.description,
      price: productItem.price, // e.g., "10.99 USD"
      link: productItem.link,
      image_link: productItem.imageLink,
      // ...
    };
  }
}
```