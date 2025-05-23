import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FacebookAdsService } from './facebook-ads.service';
import { FacebookAdsMapper } from './facebook-ads.mapper';
import { FacebookAdsApiConfig } from './facebook-ads.config';

@Module({
  imports: [ConfigModule],
  providers: [FacebookAdsService, FacebookAdsMapper, FacebookAdsApiConfig],
  exports: [FacebookAdsService],
})
export class FacebookAdsIntegrationModule {}