import { registerAs } from '@nestjs/config';

export interface CognitoConfig {
  region?: string;
  userPoolId?: string;
  clientId?: string;
}

// This demonstrates loading Cognito config via @nestjs/config.
// UserAuthConfigService would then use ConfigService.get('cognito').
// Alternatively, UserAuthConfigService itself can have direct getters for these.
export default registerAs('cognito', (): CognitoConfig => ({
  region: process.env.AWS_COGNITO_REGION,
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
}));

// If UserAuthConfigService directly provides these:
// No separate file might be needed, or this file just defines the interface.
// The SDS `UserAuthConfig` already lists cognitoUserPoolId, cognitoClientId, cognitoRegion.
// So, UserAuthConfigService would be the source of truth. This file is more for structure.