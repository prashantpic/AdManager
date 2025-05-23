```typescript
import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { ExternalTokenService } from './token.service';
// import { simpleOAuth2Client, Token } from 'simple-oauth2'; // Example library

// Placeholder for ExternalServiceId enum - should be in common/enums/external-service.enum.ts
export enum ExternalServiceId {
  GOOGLE_ADS = 'GOOGLE_ADS',
  FACEBOOK_ADS = 'FACEBOOK_ADS',
  // ... other services
}

// Placeholder for ExternalTokenDataDto - should be in auth/dtos/external-token-data.dto.ts
export interface ExternalTokenDataDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
  scopes?: string[];
  acquiredAt?: Date; // Timestamp of acquisition
  // Any other service-specific token data
  [key: string]: any;
}


interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenHost: string;
  tokenPath: string;
  authorizePath: string;
  redirectUri: string;
}

@Injectable()
export class OAuth2HandlerService {
  private readonly logger = new Logger(OAuth2HandlerService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly externalTokenService: ExternalTokenService, // For storing/retrieving tokens
  ) {}

  private getServiceOAuth2Config(service: ExternalServiceId): OAuth2Config {
    // Example: Fetch config from NestJS ConfigService based on service ID
    // These would be defined in respective config files (e.g., google-ads.config.ts)
    // and loaded into the global ConfigService.
    switch (service) {
      case ExternalServiceId.GOOGLE_ADS:
        return {
          clientId: this.configService.get<string>('googleAds.clientId')!,
          clientSecret: this.configService.get<string>('googleAds.clientSecret')!,
          tokenHost: 'https://oauth2.googleapis.com',
          tokenPath: '/token',
          authorizePath: '/auth', // This is for generating auth URL, not used in this handler directly
          redirectUri: this.configService.get<string>('GOOGLE_ADS_REDIRECT_URI')!, // Must be configured
        };
      case ExternalServiceId.FACEBOOK_ADS:
         return {
          clientId: this.configService.get<string>('facebookAds.appId')!,
          clientSecret: this.configService.get<string>('facebookAds.appSecret')!,
          tokenHost: 'https://graph.facebook.com',
          tokenPath: '/v12.0/oauth/access_token', // Check FB API docs for latest version
          authorizePath: '/dialog/oauth',
          redirectUri: this.configService.get<string>('FACEBOOK_ADS_REDIRECT_URI')!,
        };
      // Add other services
      default:
        throw new BadRequestException(`OAuth2 config not found for service: ${service}`);
    }
  }

  public async getAccessToken(
    service: ExternalServiceId,
    merchantId: string,
    scopes?: string[], // Optional, might be fixed per service
  ): Promise<string> {
    this.logger.log(`Attempting to get access token for service: ${service}, merchant: ${merchantId}`);
    let tokenData = await this.externalTokenService.retrieveToken(service, merchantId);

    if (tokenData && tokenData.accessToken && tokenData.expiresIn && tokenData.acquiredAt) {
      const now = new Date();
      const expiryTime = new Date(tokenData.acquiredAt.getTime() + tokenData.expiresIn * 1000);
      // Check if token is expired or close to expiring (e.g., within 5 minutes)
      if (expiryTime.getTime() > now.getTime() + 5 * 60 * 1000) {
        this.logger.log(`Found valid, non-expired access token for ${service}, merchant: ${merchantId}`);
        return tokenData.accessToken;
      }
      this.logger.log(`Access token for ${service}, merchant: ${merchantId} is expired or nearing expiry.`);
    }

    if (tokenData && tokenData.refreshToken) {
      this.logger.log(`Attempting to refresh token for ${service}, merchant: ${merchantId}`);
      try {
        const refreshedTokenData = await this.refreshToken(service, merchantId, tokenData.refreshToken);
        await this.externalTokenService.storeToken(service, merchantId, refreshedTokenData);
        return refreshedTokenData.accessToken;
      } catch (error) {
        this.logger.error(`Failed to refresh token for ${service}, merchant: ${merchantId}. Error: ${error.message}`, error.stack);
        // If refresh fails, may need to re-authenticate (delete token, throw error)
        await this.externalTokenService.deleteToken(service, merchantId);
        throw new HttpException('Failed to refresh token. Please re-authenticate.', HttpStatus.UNAUTHORIZED);
      }
    }

    this.logger.warn(`No valid token or refresh token found for ${service}, merchant: ${merchantId}. Re-authentication required.`);
    throw new HttpException('No valid token. Re-authentication required.', HttpStatus.UNAUTHORIZED);
    // In a full flow, this might redirect to an authorization URL or trigger a UI flow.
    // For a backend service, it typically means credentials are not set up.
  }

  public async handleCallback(
    service: ExternalServiceId,
    code: string, // Authorization code from OAuth provider
    state: string, // Optional state parameter for CSRF protection
    merchantId: string,
  ): Promise<void> {
    this.logger.log(`Handling OAuth2 callback for service: ${service}, merchant: ${merchantId}, code: ${code}`);
    const oauthConfig = this.getServiceOAuth2Config(service);

    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', oauthConfig.redirectUri);
    tokenParams.append('client_id', oauthConfig.clientId);
    tokenParams.append('client_secret', oauthConfig.clientSecret);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${oauthConfig.tokenHost}${oauthConfig.tokenPath}`, tokenParams, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }).pipe(catchError(error => {
            this.logger.error(`OAuth2 token exchange failed for ${service}: ${error.response?.data?.error_description || error.message}`, error.stack);
            throw new HttpException(`OAuth2 token exchange failed: ${error.response?.data?.error_description || error.message}`, error.response?.status || HttpStatus.BAD_REQUEST);
        }))
      );
      
      const tokenResponseData = response.data;
      const tokenData: ExternalTokenDataDto = {
        accessToken: tokenResponseData.access_token,
        refreshToken: tokenResponseData.refresh_token,
        expiresIn: tokenResponseData.expires_in, // Typically in seconds
        scopes: tokenResponseData.scope ? tokenResponseData.scope.split(' ') : undefined,
        acquiredAt: new Date(),
        // Include any other fields returned by the provider
        ...tokenResponseData,
      };

      await this.externalTokenService.storeToken(service, merchantId, tokenData);
      this.logger.log(`Successfully obtained and stored tokens for ${service}, merchant: ${merchantId}`);
    } catch (error) {
      this.logger.error(`Error during OAuth2 token exchange for ${service}, merchant ${merchantId}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to process OAuth2 callback.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async refreshToken(
    service: ExternalServiceId,
    merchantId: string,
    refreshToken: string,
  ): Promise<ExternalTokenDataDto> {
    const oauthConfig = this.getServiceOAuth2Config(service);
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'refresh_token');
    tokenParams.append('refresh_token', refreshToken);
    tokenParams.append('client_id', oauthConfig.clientId);
    tokenParams.append('client_secret', oauthConfig.clientSecret);

    const response = await firstValueFrom(
      this.httpService.post(`${oauthConfig.tokenHost}${oauthConfig.tokenPath}`, tokenParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).pipe(catchError(error => {
          this.logger.error(`OAuth2 token refresh failed for ${service}, merchant ${merchantId}: ${error.response?.data?.error_description || error.message}`, error.stack);
          throw new HttpException(`OAuth2 token refresh failed: ${error.response?.data?.error_description || error.message}`, error.response?.status || HttpStatus.BAD_REQUEST);
      }))
    );

    const tokenResponseData = response.data;
    return {
      accessToken: tokenResponseData.access_token,
      // Some services might return a new refresh token, others keep the old one
      refreshToken: tokenResponseData.refresh_token || refreshToken, 
      expiresIn: tokenResponseData.expires_in,
      scopes: tokenResponseData.scope ? tokenResponseData.scope.split(' ') : undefined,
      acquiredAt: new Date(),
      ...tokenResponseData,
    };
  }
}
```