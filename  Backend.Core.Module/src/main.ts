import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // AppModule is expected to import CoreModule
import { CoreConfigService } from './core/config/config.service';
import { LoggingService } from './core/logging/logging.service';
import { GlobalValidationPipe } from './core/common/pipes/global-validation.pipe';
import { ValidationException } from './core/common/exceptions/validation.exception';
import { GlobalHttpExceptionFilter } from './core/common/exceptions/http-exception.filter';
import { TracingInterceptor } from './core/tracing/tracing.interceptor';
import { INestApplication, Logger as NestLogger, ShutdownSignal } from '@nestjs/common';

async function bootstrap() {
  // Use NestJS's built-in logger for initial bootstrap messages
  const bootstrapLogger = new NestLogger('Bootstrap');
  let app: INestApplication;

  try {
    app = await NestFactory.create(AppModule, {
      bufferLogs: true, // Buffer logs until custom logger is attached
    });
  } catch (error) {
    bootstrapLogger.error('Failed to create Nest application instance.', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }

  // --- Core Services Initialization ---
  // These services are provided by CoreModule, which is imported by AppModule
  const coreConfigService = app.get(CoreConfigService);
  const loggingService = app.get(LoggingService); // This is our custom LoggingService

  // Set up custom structured logger for the NestJS application
  app.useLogger(loggingService);
  loggingService.log('Custom structured logger initialized and attached to NestJS application.', 'Bootstrap');

  // --- Global Configurations ---

  // REQ-14-006, REQ-15-013: Apply global validation pipe
  app.useGlobalPipes(
    new GlobalValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types implicitly
      },
      exceptionFactory: (errors) => new ValidationException(errors), // Use custom validation exception
    }),
  );
  loggingService.log('GlobalValidationPipe registered.', 'Bootstrap');

  // REQ-14-006, REQ-16-025: Apply global exception filter
  app.useGlobalFilters(new GlobalHttpExceptionFilter(loggingService));
  loggingService.log('GlobalHttpExceptionFilter registered.', 'Bootstrap');

  // REQ-11-017, REQ-16-027, REQ-16-025: Apply global tracing interceptor
  // Assuming TracingInterceptor is self-contained or gets dependencies via other means if needed.
  // If it needs DI, it should be provided in CoreModule and fetched via app.get(TracingInterceptor)
  app.useGlobalInterceptors(new TracingInterceptor());
  loggingService.log('TracingInterceptor registered.', 'Bootstrap');

  // Enable CORS
  const corsOrigin = coreConfigService.get('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',') : true, // Allow multiple origins from CSV string or allow all if true
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  loggingService.log(`CORS enabled. Allowed origins: ${corsOrigin || 'any (if boolean true)'}`, 'Bootstrap');

  // Set global API prefix (optional)
  const globalPrefix = coreConfigService.get('GLOBAL_API_PREFIX');
  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
    loggingService.log(`Global API prefix set to: "${globalPrefix}"`, 'Bootstrap');
  }

  // Enable graceful shutdown hooks
  app.enableShutdownHooks([ShutdownSignal.SIGINT, ShutdownSignal.SIGTERM]);
  loggingService.log('Shutdown hooks enabled for SIGINT and SIGTERM.', 'Bootstrap');


  // --- Start Application ---
  const port = coreConfigService.getPort();
  const host = '0.0.0.0'; // Listen on all interfaces, crucial for containerized environments

  try {
    await app.listen(port, host);
    loggingService.log(`🚀 Application successfully started. Listening on ${host}:${port}`, 'Bootstrap');
    loggingService.log(`🌱 Current NODE_ENV: ${coreConfigService.getNodeEnv()}`, 'Bootstrap');
    if (globalPrefix) {
        loggingService.log(`API available at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/${globalPrefix}`, 'Bootstrap');
    } else {
        loggingService.log(`API available at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`, 'Bootstrap');
    }

  } catch (error) {
    loggingService.error('Failed to start application listener.', 'Bootstrap', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }

  // --- Process-level Error Handling ---
  process.on('unhandledRejection', (reason, promise) => {
    loggingService.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ProcessErrorHandler');
    // Consider a more graceful shutdown or specific error handling strategy
  });

  process.on('uncaughtException', (error: Error) => {
    loggingService.error(`Uncaught Exception: ${error.message}`, 'ProcessErrorHandler', error.stack);
    // Application is in an undefined state. It's recommended to shut down.
    // process.exit(1); // Commented out to prevent immediate exit during development, but essential for prod
  });
}

bootstrap().catch(error => {
  // Fallback logger if custom logger setup fails or error occurs before it's ready
  // Using console.error as NestLogger or custom LoggingService might not be available/reliable
  console.error(`[FATAL] Failed to bootstrap application: ${error.message}`, error.stack);
  process.exit(1);
});