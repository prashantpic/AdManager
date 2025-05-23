import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SnapchatAdsService } from './snapchat-ads.service';
import { SnapchatAdsMapper } from './snapchat-ads.mapper';
import { SnapchatAdsApiConfig } from './snapchat-ads.config';

@Module({
  imports: [ConfigModule],
  providers: [SnapchatAdsService, SnapchatAdsMapper, SnapchatAdsApiConfig],
  exports: [SnapchatAdsService],
})
export class SnapchatAdsIntegrationModule {}