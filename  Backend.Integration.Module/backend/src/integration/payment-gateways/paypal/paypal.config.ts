```typescript
import { registerAs } from '@nestjs/config';

export type PayPalMode = 'sandbox' | 'live';

export interface PayPalApiConfigInterface {
  clientId: string;
  clientSecret: string;
  mode: PayPalMode;
}

export const payPalApiConfig = registerAs('paypal', (): PayPalApiConfigInterface => ({
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  mode: (process.env.PAYPAL_MODE as PayPalMode) || 'sandbox',
}));

export class PayPalApiConfig implements PayPalApiConfigInterface {
  clientId: string;
  clientSecret: string;
  mode: PayPalMode;

  constructor(config: PayPalApiConfigInterface) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.mode = config.mode;
  }
}
```