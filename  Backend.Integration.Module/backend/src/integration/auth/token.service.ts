```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { CoreCacheService } from 'src/core/cache/cache.service'; // For caching access tokens
// import { CoreSecretsService } from 'src/core/secrets/secrets.service'; // For storing refresh tokens securely
import { OAuth2HandlerService } from './oauth2.handler';
import { ApiKeyHandlerService } from './api-key.handler';


// Placeholder for ExternalServiceId enum
export enum ExternalServiceId {
  GOOGLE_ADS = 'GOOGLE_ADS',
  FACEBOOK_ADS = 'FACEBOOK_ADS',
  TIKTOK_ADS = 'TIKTOK_ADS',
  SNAPCHAT_ADS = 'SNAPCHAT_ADS',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL', // PayPal can use OAuth2 or API keys depending on API
  SHIPPO = 'SHIPPO',
  // ... other services
}

// Placeholder for ExternalTokenDataDto - should be in auth/dtos/external-token-data.dto.ts
export interface ExternalTokenDataDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
  scopes?: string[];
  acquiredAt?: Date;
  // Any other service-specific token data
  [key: string]: any;
}

// Placeholder for IAuthStrategy
export interface IAuthStrategy {
  getAuthHeaders(merchantId?: string, serviceConfig?: any): Promise<Record<string, string>>;
}


// In a real app, this would use a persistent store (DB, Secrets Manager) and cache (Redis)
const tokenStore: Map<string, ExternalTokenDataDto> = new Map();
const CACHE_TTL_ACCESS_TOKEN = 3300; // 55 minutes in seconds, slightly less than typical 1-hour expiry


@Injectable()
export class ExternalTokenService {
  private readonly logger = new Logger(ExternalTokenService.name);
  // private oAuth2Handler: OAuth2HandlerService; // To avoid circular dependency if directly injected
  // private apiKeyHandler: ApiKeyHandlerService;

  constructor(
    // Lazy load or use forwardRef if OAuth2HandlerService itself depends on ExternalTokenService,
    // which it does in this design (OAuth2HandlerService calls storeToken/retrieveToken).
    // For now, let's assume handlers are more like utilities called by this service.
    // Or, this service calls specific methods on handlers that don't cause circularity.
    // Let's assume this service determines the strategy and calls the appropriate handler.
    private readonly configService: ConfigService, // For service specific auth type config
    // @Inject(forwardRef(() => OAuth2HandlerService)) private readonly oAuth2HandlerService: OAuth2HandlerService,
    // private readonly apiKeyHandlerService: ApiKeyHandlerService,
    // private readonly cacheService: CoreCacheService, // Example
    // private readonly secretsService: CoreSecretsService, // Example
  ) {
    // This is a simplification; proper DI with forwardRef or restructuring is needed
    // if OAuth2HandlerService and ApiKeyHandlerService are not directly injectable here due to circular deps.
    // For this generation, we'll assume they can be injected or called statically if they were utils.
    // Given the design, OAuth2HandlerService DOES call ExternalTokenService.storeToken.
    // ExternalTokenService.getAuthHeaders calls OAuth2HandlerService.getAccessToken. This is circular.
    // Solution: OAuth2HandlerService.getAccessToken can be the main entry point for OAuth2,
    // and it uses ExternalTokenService.retrieveToken/storeToken.
    // ExternalTokenService.getAuthHeaders would then be simplified or delegate differently.
    // OR, ExternalTokenService holds the logic to call different auth handlers.
  }


  // This method is called by HttpClientService
  public async getAuthHeaders(service: ExternalServiceId, merchantId?: string): Promise<Record<string, string>> {
    // This method needs access to OAuth2HandlerService and ApiKeyHandlerService
    // For now, simulate their availability. In a real NestJS app, use proper DI and potentially forwardRef.
    const tempOAuth2Handler = new OAuth2HandlerService(null as any, this.configService, this); // HACK: avoid full DI setup for this snippet
    const tempApiKeyHandler = new ApiKeyHandlerService(this.configService); // HACK

    this.logger.debug(`Getting auth headers for service ${service}, merchant ${merchantId}`);
    // Determine auth type based on service (this could be part of service config)
    // This is a simplified mapping.
    const serviceAuthConfig = this.getServiceAuthConfig(service);


    switch (serviceAuthConfig.type) {
      case 'oauth2':
        const accessToken = await tempOAuth2Handler.getAccessToken(service, merchantId!); // Assume merchantId is required for OAuth2 here
        return { Authorization: `Bearer ${accessToken}` };
      case 'apikey':
        const apiKey = await tempApiKeyHandler.getApiKey(service, merchantId);
        // Header name can vary by API
        const apiKeyHeaderName = serviceAuthConfig.headerName || 'X-API-KEY';
        const apiKeyPrefix = serviceAuthConfig.prefix ? `${serviceAuthConfig.prefix} ` : '';
        return { [apiKeyHeaderName]: `${apiKeyPrefix}${apiKey}` };
      case 'bearer_token_from_config': // e.g. some services use a static bearer token
        const staticToken = this.configService.get<string>(serviceAuthConfig.configKey!);
        if(!staticToken) throw new Error(`Static token not found for ${service}`);
        return { Authorization: `Bearer ${staticToken}` };
      default:
        this.logger.warn(`Unsupported auth type or no auth configured for service: ${service}`);
        return {}; // Or throw error
    }
  }

  private getServiceAuthConfig(service: ExternalServiceId): { type: string; headerName?: string; prefix?: string, configKey?: string } {
    // This should come from a more structured configuration, e.g. per-service config files
    switch (service) {
      case ExternalServiceId.GOOGLE_ADS:
      case ExternalServiceId.FACEBOOK_ADS:
      case ExternalServiceId.TIKTOK_ADS: // Assuming OAuth2 for TikTok
      case ExternalServiceId.SNAPCHAT_ADS:
      case ExternalServiceId.PAYPAL: // If using PayPal OAuth2
        return { type: 'oauth2' };
      case ExternalServiceId.SHIPPO:
        return { type: 'apikey', headerName: 'Authorization', prefix: 'ShippoToken' }; // Shippo specific
      case ExternalServiceId.STRIPE:
        return { type: 'apikey', headerName: 'Authorization', prefix: 'Bearer' }; // Stripe API keys are used as Bearer tokens
      // Example for a service that uses a static bearer token from config:
      // case ExternalServiceId.SOME_OTHER_API:
      //   return { type: 'bearer_token_from_config', configKey: 'SOME_OTHER_API_STATIC_TOKEN' };
      default:
        this.logger.warn(`No specific auth config found for service ${service}, defaulting to no auth or expecting service client to handle.`);
        return { type: 'none' };
    }
  }


  public async storeToken(service: ExternalServiceId, merchantId: string, tokenData: ExternalTokenDataDto): Promise<void> {
    const key = this.generateKey(service, merchantId);
    this.logger.log(`Storing token for key: ${key}`);
    // In real app:
    // if (tokenData.accessToken) {
    //   await this.cacheService.set(`access_token:${key}`, tokenData.accessToken, tokenData.expiresIn || CACHE_TTL_ACCESS_TOKEN);
    // }
    // if (tokenData.refreshToken) {
    //   // Store refresh token securely, e.g., encrypted in DB or Secrets Manager
    //   await this.secretsService.setSecret(`refresh_token:${key}`, tokenData.refreshToken);
    // }
    // For now, use in-memory store for the whole DTO
    tokenStore.set(key, { ...tokenData, acquiredAt: tokenData.acquiredAt || new Date() });
  }

  public async retrieveToken(service: ExternalServiceId, merchantId: string): Promise<ExternalTokenDataDto | null> {
    const key = this.generateKey(service, merchantId);
    this.logger.log(`Retrieving token for key: ${key}`);
    // In real app, fetch from cache/secrets:
    // const accessToken = await this.cacheService.get(`access_token:${key}`);
    // const refreshToken = await this.secretsService.getSecret(`refresh_token:${key}`);
    // const fullTokenDataFromDB = await this.dbRepository.findToken(key); // if other parts stored in DB
    // If found, construct and return ExternalTokenDataDto
    // For now, use in-memory store:
    const storedData = tokenStore.get(key);
    if (storedData) {
        // Simulate token expiry check (OAuth2Handler does a more robust check)
        if (storedData.expiresIn && storedData.acquiredAt) {
            const now = new Date();
            const expiryTime = new Date(storedData.acquiredAt.getTime() + storedData.expiresIn * 1000);
            if (expiryTime <= now) {
                this.logger.warn(`In-memory token for ${key} is expired based on simple check.`);
                // Don't return expired access token directly, rely on refresh logic.
                // Return the DTO so refresh token can be used.
            }
        }
        return storedData;
    }
    return null;
  }

  public async deleteToken(service: ExternalServiceId, merchantId: string): Promise<void> {
    const key = this.generateKey(service, merchantId);
    this.logger.log(`Deleting token for key: ${key}`);
    // In real app:
    // await this.cacheService.del(`access_token:${key}`);
    // await this.secretsService.deleteSecret(`refresh_token:${key}`);
    // await this.dbRepository.deleteToken(key);
    tokenStore.delete(key);
  }

  private generateKey(service: ExternalServiceId, merchantId: string): string {
    return `${service}:${merchantId}`;
  }
}
```