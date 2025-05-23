```typescript
import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { pinoHttpConfigFactory } from './logging.config';
import { LoggingService } from './logging.service';
import { TracingModule } from '../tracing/tracing.module'; // TracingService might be used for correlation IDs

/**
 * @class CoreLoggingModule
 * @description NestJS module for centralized structured logging.
 * Configures and provides the `LoggingService` (using Pino, integrated with `nestjs-pino`).
 * REQ-11-016, REQ-14-015, REQ-16-025, REQ-16-026
 */
@Module({
  imports: [
    CoreConfigModule,
    TracingModule, // Make TracingService available if needed by logging.config or LoggingService
    PinoLoggerModule.forRootAsync({
      imports: [CoreConfigModule, TracingModule], // Ensure dependencies are available in the factory
      inject: [CoreConfigService /*, TracingService - if needed directly in pinoHttpConfigFactory */],
      useFactory: pinoHttpConfigFactory,
    }),
  ],
  providers: [LoggingService], // Provide custom LoggingService wrapper
  exports: [LoggingService, PinoLoggerModule], // Export custom wrapper and also PinoLoggerModule if direct injection of PinoLogger is desired elsewhere
})
export class CoreLoggingModule {}
```