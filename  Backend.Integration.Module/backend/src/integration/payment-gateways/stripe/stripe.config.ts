```typescript
import { registerAs } from '@nestjs/config';

export interface StripeApiConfigInterface {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}

export const stripeApiConfig = registerAs('stripe', (): StripeApiConfigInterface => ({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publicKey: process.env.STRIPE_PUBLIC_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
}));

export class StripeApiConfig implements StripeApiConfigInterface {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;

  constructor(config: StripeApiConfigInterface) {
    this.secretKey = config.secretKey;
    this.publicKey = config.publicKey;
    this.webhookSecret = config.webhookSecret;
  }
}
```