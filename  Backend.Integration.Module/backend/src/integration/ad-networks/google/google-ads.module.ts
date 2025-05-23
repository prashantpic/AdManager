import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleAdsService } from './google-ads.service';
import { GoogleAdsMapper } from './google-ads.mapper';
import { GoogleAdsApiConfig } from './google-ads.config';
// Assuming HttpClientService and ExternalTokenService are provided by a common/core module
// and GoogleAdsApiConfig is registered globally or in a shared config module.
// If GoogleAdsMapper is a simple class, it can be directly provided.
// If it has dependencies, it might need to be in its own module or imported correctly.

@Module({
  imports: [
    ConfigModule, // Required if GoogleAdsApiConfig is resolved via ConfigService internally
    // HttpModule from @nestjs/axios might be imported in a CoreIntegrationModule that provides HttpClientService
  ],
  providers: [
    GoogleAdsService,
    GoogleAdsMapper, // Assuming GoogleAdsMapper is self-contained or its dependencies are met
    GoogleAdsApiConfig, // Assuming this is how config objects are provided
    // If GoogleAdsApiConfig is loaded via ConfigService.get('googleAds'), then it might not be a provider itself
    // but injected into GoogleAdsService via ConfigService.
    // For this exercise, assuming it's an injectable provider.
  ],
  exports: [GoogleAdsService],
})
export class GoogleAdsIntegrationModule {}