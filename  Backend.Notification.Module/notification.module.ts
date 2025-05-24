import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './application/notification.service';
import { SesAdapter } from './infrastructure/ses/ses.adapter';
import { SnsAdapter } from './infrastructure/sns/sns.adapter';
import { notificationConfig } from './config/notification.config';

@Module({
  imports: [
    ConfigModule.forFeature(notificationConfig),
  ],
  providers: [
    NotificationService,
    SesAdapter,
    SnsAdapter,
    Logger, // Provides NestJS Logger, assuming it's available or configured globally/core
  ],
  exports: [NotificationService],
})
export class NotificationModule {}