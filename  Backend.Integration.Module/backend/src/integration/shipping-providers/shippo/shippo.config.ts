```typescript
import { registerAs } from '@nestjs/config';

export interface ShippoApiConfigInterface {
  apiKey: string;
}

export const shippoApiConfig = registerAs('shippo', (): ShippoApiConfigInterface => ({
  apiKey: process.env.SHIPPO_API_KEY!,
}));

export class ShippoApiConfig implements ShippoApiConfigInterface {
  apiKey: string;

  constructor(config: ShippoApiConfigInterface) {
    this.apiKey = config.apiKey;
  }
}
```