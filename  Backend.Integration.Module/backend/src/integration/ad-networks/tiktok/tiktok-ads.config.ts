```typescript
import { registerAs } from '@nestjs/config';

export interface TikTokAdsApiConfigInterface {
  appId: string;
  secret: string;
  // Potentially advertiserId if needed globally
}

export const tikTokAdsApiConfig = registerAs('tikTokAds', (): TikTokAdsApiConfigInterface => ({
  appId: process.env.TIKTOK_ADS_APP_ID!,
  secret: process.env.TIKTOK_ADS_SECRET!,
}));

export class TikTokAdsApiConfig implements TikTokAdsApiConfigInterface {
  appId: string;
  secret: string;

  constructor(config: TikTokAdsApiConfigInterface) {
    this.appId = config.appId;
    this.secret = config.secret;
  }
}
```