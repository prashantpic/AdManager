```typescript
import { SQSClientConfig } from '@aws-sdk/client-sqs';
import { CoreConfigService } from '../../config/config.service';

/**
 * @function sqsConfigFactory
 * @description Configuration factory for AWS SQS SDK client.
 * Retrieves AWS region and optional local endpoint URL from `CoreConfigService`.
 * REQ-11-011, REQ-16-011
 * @param coreConfigService - Service for accessing application configuration.
 * @returns SQSClientConfig object.
 */
export const sqsConfigFactory = (
  coreConfigService: CoreConfigService,
): SQSClientConfig => {
  const region = coreConfigService.getAwsRegion();
  // const endpoint = coreConfigService.getSqsLocalEndpoint(); // If local SQS (e.g., LocalStack) is used

  const config: SQSClientConfig = {
    region,
  };

  // if (endpoint && coreConfigService.isSqsLocalEndpointEnabled()) {
  //   config.endpoint = endpoint;
  // }
  // Credentials will be automatically picked up from the environment.

  return config;
};
```