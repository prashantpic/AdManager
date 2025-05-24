import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './application/notification.service';
import { SesAdapter } from './infrastructure/ses/ses.adapter';
import { SnsAdapter } from './infrastructure/sns/sns.adapter';
import { notificationConfig } from './config/notification.config';

@Module({
  imports: [
    ConfigModule.forFeature(notificationConfig), // Assumes ConfigModule is configured globally
  ],
  providers: [
    NotificationService,
    SesAdapter,
    SnsAdapter,
    Logger // Provide NestJS Logger
  ],
  exports: [NotificationService],
})
export class NotificationModule {}