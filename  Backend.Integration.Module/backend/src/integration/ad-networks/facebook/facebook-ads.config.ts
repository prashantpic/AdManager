```typescript
import { registerAs } from '@nestjs/config';

export interface FacebookAdsApiConfigInterface {
  appId: string;
  appSecret: string;
  // Potentially marketingApiToken, systemUserAccessToken for server-to-server
}

export const facebookAdsApiConfig = registerAs('facebookAds', (): FacebookAdsApiConfigInterface => ({
  appId: process.env.FACEBOOK_ADS_APP_ID!,
  appSecret: process.env.FACEBOOK_ADS_APP_SECRET!,
}));

export class FacebookAdsApiConfig implements FacebookAdsApiConfigInterface {
  appId: string;
  appSecret: string;

  constructor(config: FacebookAdsApiConfigInterface) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
  }
}
```