import { Module } from '@nestjs/common';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';
import { FeatureFlagsService } from './feature-flags.service';
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { CoreCacheModule } from '../cache/cache.module';

export const APPCONFIG_DATA_CLIENT = 'APPCONFIG_DATA_CLIENT';

@Module({
  imports: [CoreConfigModule, CoreCacheModule], // CacheModule for caching flag configurations
  providers: [
    {
      provide: APPCONFIG_DATA_CLIENT,
      useFactory: (configService: CoreConfigService) => {
        return new AppConfigDataClient({
          region: configService.getAwsRegion(),
          // endpoint: configService.get('APPCONFIG_DATA_ENDPOINT') // If using a local/VPC endpoint
        });
      },
      inject: [CoreConfigService],
    },
    FeatureFlagsService,
  ],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}