import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './application/notification.service';
import { SesAdapter } from './infrastructure/ses/ses.adapter';
import { SnsAdapter } from './infrastructure/sns/sns.adapter';
import { notificationConfig } from './config/notification.config';
// Assuming LoggerService from Backend.Core.Module is provided globally or aliased.
// For this exercise, we will use NestJS's built-in Logger.

@Module({
  imports: [
    // ConfigModule.forFeature is used to register configuration for a specific feature module.
    // This assumes that notificationConfig has been loaded globally via ConfigModule.forRoot in the root module,
    // or that ConfigModule is already imported and configured.
    ConfigModule.forFeature(notificationConfig),
  ],
  providers: [
    NotificationService,
    SesAdapter,
    SnsAdapter,
    Logger, // Providing NestJS's built-in Logger
    // If a custom LoggerService (e.g., from Backend.Core.Module) is globally available,
    // it might be injected directly or via a custom provider.
    // For example:
    // {
    //   provide: LoggerService, // or a custom token
    //   useExisting: LoggerService, // if globally provided
    // }
  ],
  exports: [NotificationService],
})
export class NotificationModule {}