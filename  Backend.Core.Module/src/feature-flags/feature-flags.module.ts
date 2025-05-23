import { Module, Provider, Logger } from '@nestjs/common';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { FeatureFlagsService } from './feature-flags.service';
import { IFeatureFlagsService } from './feature-flags.interface';
import { CacheModule } from '../cache/cache.module'; // Optional: for caching flags

export const APPCONFIG_DATA_CLIENT = 'APPCONFIG_DATA_CLIENT';

const appConfigDataProvider: Provider = {
  provide: APPCONFIG_DATA_CLIENT,
  useFactory: (configService: CoreConfigService) => {
    const region = configService.getAwsRegion();
    if (!region) {
      // Logger cannot be used here before module initialization
      console.error('AWS Region not configured for AppConfigDataClient.');
      // Potentially throw or return a non-functional client
    }
    return new AppConfigDataClient({ region });
  },
  inject: [CoreConfigService],
};

@Module({
  imports: [CoreConfigModule, CacheModule], // CacheModule is optional
  providers: [
    appConfigDataProvider,
    {
      provide: IFeatureFlagsService,
      useClass: FeatureFlagsService,
    },
  ],
  exports: [IFeatureFlagsService],
})
export class FeatureFlagsModule {}