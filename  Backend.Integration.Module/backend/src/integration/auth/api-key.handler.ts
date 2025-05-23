```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Placeholder for ExternalServiceId enum
export enum ExternalServiceId {
  SHIPPO = 'SHIPPO',
  STRIPE = 'STRIPE', // Stripe uses API keys
  // ... other services
}

@Injectable()
export class ApiKeyHandlerService {
  private readonly logger = new Logger(ApiKeyHandlerService.name);

  constructor(private readonly configService: ConfigService) {}

  public async getApiKey(service: ExternalServiceId, merchantId?: string): Promise<string> {
    this.logger.log(`Fetching API key for service: ${service}, merchant: ${merchantId || 'N/A'}`);
    
    let apiKey: string | undefined;

    // Logic to retrieve API key:
    // 1. Per-merchant API key (if merchantId is provided and service supports it)
    //    - This might involve looking up a merchant-specific configuration or secret.
    //    - e.g., `this.configService.get<string>(`MERCHANT_${merchantId}_${service}_API_KEY`)`
    // 2. Platform-wide API key for the service
    //    - e.g., `this.configService.get<string>(`${service}_API_KEY`)`

    switch (service) {
      case ExternalServiceId.SHIPPO:
        // Shippo usually has one API key for the platform or per account.
        // If it's per merchant, the key name needs to incorporate merchantId.
        apiKey = this.configService.get<string>('shippo.apiKey'); // Assumes shippo.config loads it
        // Or, if per merchant: `this.configService.get<string>(`SHIPPO_API_KEY_${merchantId}`)`
        break;
      case ExternalServiceId.STRIPE:
        // Stripe API keys are often specific to a merchant's Stripe account connected to the platform.
        if (merchantId) {
            // Example: retrieve from a merchant-specific config key
            // This requires a system to store per-merchant Stripe keys securely.
            // For instance, a MerchantStripeConfig table or specific secret per merchant.
            apiKey = this.configService.get<string>(`MERCHANT_STRIPE_SECRET_KEY_${merchantId}`);
            if (!apiKey) {
                 // Fallback to a general platform key if applicable, or specific merchant key from general config
                 apiKey = this.configService.get<string>('stripe.secretKey'); // if this is the merchant's specific key
            }
        } else {
            // Platform-level Stripe key (e.g., for platform's own operations)
            apiKey = this.configService.get<string>('stripe.secretKey');
        }
        break;
      // Add cases for other API key-based services
      default:
        this.logger.warn(`API key retrieval not configured for service: ${service}`);
        throw new NotFoundException(`API key configuration not found for service: ${service}`);
    }

    if (!apiKey) {
      this.logger.error(`API key not found for service: ${service}, merchant: ${merchantId || 'N/A'}`);
      throw new NotFoundException(`API key not found for service: ${service}`);
    }

    return apiKey;
  }
}
```