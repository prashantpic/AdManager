```typescript
import { Module } from '@nestjs/common';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { CoreConfigModule } from '../config.module';
import { CoreConfigService } from '../config.service';
import { SecretsService } from './secrets.service';
import { ISecretsService } from './secrets.interface';
import { CacheModule } from '../../cache/cache.module'; // For potential Redis caching layer for secrets

export const SECRETS_MANAGER_CLIENT = 'SECRETS_MANAGER_CLIENT';

/**
 * @class SecretsModule
 * @description NestJS module dedicated to managing the retrieval of secrets from AWS Secrets Manager.
 * It provides the `SecretsService`.
 * REQ-16-020, REQ-16-040, REQ-14-013, REQ-15-004
 */
@Module({
  imports: [CoreConfigModule, CacheModule], // CacheModule might be used by SecretsService for caching
  providers: [
    {
      provide: ISecretsService,
      useClass: SecretsService,
    },
    {
      provide: SECRETS_MANAGER_CLIENT,
      useFactory: (coreConfigService: CoreConfigService) => {
        return new SecretsManagerClient({
          region: coreConfigService.getAwsRegion(),
          // Credentials will be automatically picked up from the environment (IAM role, env vars, etc.)
        });
      },
      inject: [CoreConfigService],
    },
  ],
  exports: [ISecretsService],
})
export class SecretsModule {}
```