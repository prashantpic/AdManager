import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CoreConfigService } from './core/config/config.service';
import { LoggingService } from './core/logging/logging.service';
import { GlobalValidationPipe } from './core/common/pipes/global-validation.pipe';
import { GlobalHttpExceptionFilter } from './core/common/exceptions/http-exception.filter';
import { TracingInterceptor } from './core/tracing/tracing.interceptor';
import { INestApplication, Logger } from '@nestjs/common';
import { ValidationException } from './core/common/exceptions/validation.exception';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until our custom logger is ready
  });

  // Initialize and use our custom structured logger
  // LoggingService is provided by CoreModule, which is imported by AppModule
  const appLogger = app.get(LoggingService);
  app.useLogger(appLogger);

  // Retrieve CoreConfigService for application configurations
  // CoreConfigService is provided by CoreModule
  const configService = app.get(CoreConfigService);

  // Global Prefix (e.g., '/api')
  const globalPrefix = configService.get('GLOBAL_PREFIX') || 'api';
  app.setGlobalPrefix(globalPrefix);
  appLogger.log(`Global prefix set to '/${globalPrefix}'`, 'Bootstrap');

  // CORS Configuration
  // TODO: Configure CORS more restrictively based on specific requirements (e.g., origin, methods)
  app.enableCors();
  appLogger.log('CORS enabled with default settings', 'Bootstrap');

  // Apply Global Pipes
  // GlobalValidationPipe should be configured internally as per SDS 5.6
  // It will use class-validator and class-transformer, and throw ValidationException
  app.useGlobalPipes(new GlobalValidationPipe());
  appLogger.log('GlobalValidationPipe applied', 'Bootstrap');

  // Apply Global Filters
  // GlobalHttpExceptionFilter requires LoggingService for logging errors
  app.useGlobalFilters(new GlobalHttpExceptionFilter(appLogger));
  appLogger.log('GlobalHttpExceptionFilter applied', 'Bootstrap');

  // Apply Global Interceptors
  // TracingInterceptor handles distributed tracing setup for requests
  app.useGlobalInterceptors(new TracingInterceptor()); // Assuming TracingInterceptor initializes X-Ray or uses global SDK
  appLogger.log('TracingInterceptor applied', 'Bootstrap');

  // Enable Graceful Shutdown Hooks
  app.enableShutdownHooks();
  appLogger.log('Shutdown hooks enabled', 'Bootstrap');

  // Get port from configuration
  const port = configService.getPort();

  await app.listen(port);
  appLogger.log(`Application listening on port ${port}`, 'Bootstrap');
  appLogger.log(`Application running in ${configService.getNodeEnv()} mode`, 'Bootstrap');
}

bootstrap().catch(error => {
  // Fallback logger if custom logger isn't available or fails
  const fallbackLogger = new Logger('BootstrapError');
  fallbackLogger.error('Application failed to bootstrap:', error);
  process.exit(1);
});