import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TikTokAdsService } from './tiktok-ads.service';
import { TikTokAdsMapper } from './tiktok-ads.mapper';
import { TikTokAdsApiConfig } from './tiktok-ads.config';

@Module({
  imports: [ConfigModule],
  providers: [TikTokAdsService, TikTokAdsMapper, TikTokAdsApiConfig],
  exports: [TikTokAdsService],
})
export class TikTokAdsIntegrationModule {}