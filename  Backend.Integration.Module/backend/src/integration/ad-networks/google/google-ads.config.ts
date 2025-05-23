```typescript
import { registerAs } from '@nestjs/config';

export interface GoogleAdsApiConfigInterface {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  loginCustomerId?: string;
  // Add other Google Ads specific configurations if needed
}

// This configuration would be loaded by the CoreModule's ConfigService,
// typically from environment variables or AWS Secrets Manager.
// Example: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, etc.

export const googleAdsApiConfig = registerAs('googleAds', (): GoogleAdsApiConfigInterface => ({
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  clientId: process.env.GOOGLE_ADS_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
}));

// Usage:
// constructor(private configService: ConfigService) {
//   const devToken = this.configService.get<string>('googleAds.developerToken');
// }
// For this file structure, we'll define the class directly for injection purposes.
// The actual loading is managed by NestJS ConfigModule setup elsewhere (e.g. CoreModule).

export class GoogleAdsApiConfig implements GoogleAdsApiConfigInterface {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  loginCustomerId?: string;

  constructor(config: GoogleAdsApiConfigInterface) {
    this.developerToken = config.developerToken;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.loginCustomerId = config.loginCustomerId;
  }
}
```