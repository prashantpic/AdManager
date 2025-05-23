```typescript
import { registerAs } from '@nestjs/config';

export interface SnapchatAdsApiConfigInterface {
  clientId: string;
  clientSecret: string;
  // Potentially adAccountId if needed globally
}

export const snapchatAdsApiConfig = registerAs('snapchatAds', (): SnapchatAdsApiConfigInterface => ({
  clientId: process.env.SNAPCHAT_ADS_CLIENT_ID!,
  clientSecret: process.env.SNAPCHAT_ADS_CLIENT_SECRET!,
}));

export class SnapchatAdsApiConfig implements SnapchatAdsApiConfigInterface {
  clientId: string;
  clientSecret: string;

  constructor(config: SnapchatAdsApiConfigInterface) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }
}
```