```typescript
import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { ExternalTokenService } from './token.service';
import { OAuth2HandlerService } from './oauth2.handler';
import { ApiKeyHandlerService } from './api-key.handler';

// This module provides authentication services for external integrations.
// It might depend on CoreModule for secure secret storage or database access
// if tokens are persisted beyond in-memory.

@Global() // Making it global for easier injection into various integration services
@Module({
  imports: [
    HttpModule, // For OAuth2HandlerService to make calls to token endpoints
    ConfigModule, // To access API keys, client IDs/secrets
  ],
  providers: [
    ExternalTokenService,
    OAuth2HandlerService,
    ApiKeyHandlerService,
  ],
  exports: [
    ExternalTokenService,
    OAuth2HandlerService,
    ApiKeyHandlerService,
  ],
})
export class ExternalAuthModule {}
```