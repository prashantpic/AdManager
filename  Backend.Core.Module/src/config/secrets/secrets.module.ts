```typescript
import { Module, Global } from '@nestjs/common';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SecretsService } from './secrets.service';
import { ISecretsService } from './secrets.interface';
import { CoreConfigModule } from '../config.module';
import { CoreConfigService } from '../config.service';

export const SECRETS_MANAGER_CLIENT = 'SECRETS_MANAGER_CLIENT';

/**
 * @module SecretsModule
 * @description NestJS module dedicated to managing the retrieval of secrets
 * from AWS Secrets Manager. It provides the `SecretsService`.
 */
@Global()
@Module({
  imports: [CoreConfigModule], // Depends on CoreConfigService for AWS region
  providers: [
    {
      provide: SECRETS_MANAGER_CLIENT,
      useFactory: (configService: CoreConfigService) => {
        return new SecretsManagerClient({
          region: configService.getAwsRegion(),
          // TODO: Add credentials if not using IAM roles (e.g., for local development)
          // credentials: { accessKeyId: '...', secretAccessKey: '...' }
        });
      },
      inject: [CoreConfigService],
    },
    {
      provide: ISecretsService,
      useClass: SecretsService,
    },
  ],
  exports: [ISecretsService],
})
export class SecretsModule {}
```