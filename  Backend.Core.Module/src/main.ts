import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module'; // Assuming AppModule is your root application module
import { CoreConfigService } from './config/config.service';
import { LoggingService } from './logging/logging.service';
import { GlobalValidationPipe } from './common/pipes/global-validation.pipe';
import { GlobalHttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { TracingInterceptor } from './tracing/tracing.interceptor';
import { INestApplication, LoggerService } from '@nestjs/common';
import { LOGGER_P_TOKEN, PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until pino logger is initialized
  });

  // Setup Custom Structured Logger (Pino)
  // If using nestjs-pino, the logger is available via injection or app.get(LOGGER_P_TOKEN)
  // If LoggingService is a wrapper, use app.get(LoggingService)
  // The SDS mentions LoggingService wrapping the logger.
  // If LoggingService itself is the NestJS LoggerService implementation:
  const appLogger: LoggerService = app.get(LoggingService);
  app.useLogger(appLogger);

  // Or if using nestjs-pino directly and LoggingService is just a utility for specific logs:
  // const pinoLogger = app.get<PinoLogger>(LOGGER_P_TOKEN);
  // app.useLogger(pinoLogger);
  // For consistency with SDS LoggingService, we assume it's the primary logger.

  const configService = app.get(CoreConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);

  // Global Pipes
  // REQ-15-013: Validate incoming DTOs
  // REQ-14-006: Standardized input validation
  app.useGlobalPipes(
    new GlobalValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties not defined in DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      // exceptionFactory is handled within GlobalValidationPipe to throw ValidationException
    }),
  );

  // Global Filters
  // REQ-14-006: Standardized JSON error responses
  // REQ-16-025: Log errors consistently
  app.useGlobalFilters(new GlobalHttpExceptionFilter(httpAdapterHost, appLogger));

  // Global Interceptors
  // REQ-11-017: Distributed tracing setup
  // REQ-16-027: Distributed tracing setup
  // REQ-16-025: Contextual information for logging (trace IDs)
  app.useGlobalInterceptors(new TracingInterceptor()); // TracingInterceptor uses AWS X-Ray SDK internally

  // CORS Configuration (example, adjust as needed)
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*', // Configure allowed origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global API Prefix (example, adjust as needed)
  const globalPrefix = configService.get('GLOBAL_API_PREFIX');
  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
  }

  // Graceful Shutdown
  app.enableShutdownHooks();

  const port = configService.getPort();
  await app.listen(port);

  appLogger.log(
    `Application '${configService.get('APP_NAME') || 'AdManager Platform'}' is running on: ${await app.getUrl()}`,
    'Bootstrap',
  );
  appLogger.log(
    `Environment: ${configService.getNodeEnv()}`,
    'Bootstrap',
  );
}

bootstrap().catch((error) => {
  // Use a fallback logger for bootstrap errors if the app logger isn't available
  console.error('Error during application bootstrap:', error);
  process.exit(1);
});