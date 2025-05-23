```typescript
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { CoreConfigService } from '../../config/config.service';

/**
 * @function dynamoDBConfigFactory
 * @description Configuration factory for AWS DynamoDB SDK client.
 * Retrieves AWS region and optional local endpoint URL from `CoreConfigService`.
 * REQ-11-009, REQ-14-005, REQ-16-008, REQ-14-012, REQ-15-002
 * @param coreConfigService - Service for accessing application configuration.
 * @returns DynamoDBClientConfig object.
 */
export const dynamoDBConfigFactory = (
  coreConfigService: CoreConfigService,
): DynamoDBClientConfig => {
  const region = coreConfigService.getAwsRegion();
  const endpoint = coreConfigService.getDynamoDBLocalEndpoint(); // e.g., 'http://localhost:8000' for local dev

  const config: DynamoDBClientConfig = {
    region,
  };

  if (endpoint && coreConfigService.isDynamoDBLocalEndpointEnabled()) {
    config.endpoint = endpoint;
    // For DynamoDB Local, credentials might not be strictly necessary or can be dummy values.
    // AWS SDK v3 usually handles this gracefully if endpoint is local.
    // config.credentials = { accessKeyId: 'dummy', secretAccessKey: 'dummy' }; // If required by local setup
  }
  // Credentials will be automatically picked up from the environment (IAM role, env vars, etc.) for AWS.

  return config;
};
```