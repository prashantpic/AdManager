import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SesAdapter } from '../infrastructure/ses/ses.adapter';
import { SnsAdapter } from '../infrastructure/sns/sns.adapter';
import { SendEmailDto } from './dto/send-email.dto';
import { PublishSnsEventDto } from './dto/publish-sns-event.dto';
import { NotificationStatusDto } from './dto/notification-status.dto';
import { IEmailNotificationParams } from '../domain/interfaces/email-notification-params.interface';
import { IEventNotificationParams } from '../domain/interfaces/event-notification-params.interface';
import { notificationConfig } from '../../config/notification.config';

@Injectable()
export class NotificationService {
  constructor(
    private readonly sesAdapter: SesAdapter,
    private readonly snsAdapter: SnsAdapter,
    @Inject(Logger) private readonly logger: Logger,
    @Inject(notificationConfig.KEY)
    private readonly notifConfig: ConfigType<typeof notificationConfig>,
  ) {
    this.logger.setContext(NotificationService.name);
  }

  async sendTransactionalEmail(payload: SendEmailDto): Promise<NotificationStatusDto> {
    this.logger.log(
      `Attempting to send transactional email. Subject: "${payload.subject}", To: "${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}"`,
    );

    // DTO validation is expected to be handled by NestJS ValidationPipe
    // at the entry point (e.g., controller or calling service).

    try {
      const params: IEmailNotificationParams = {
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        from: payload.from || this.notifConfig.ses.defaultSender,
        replyTo: Array.isArray(payload.replyTo)
          ? payload.replyTo
          : payload.replyTo
            ? [payload.replyTo]
            : undefined,
        subject: payload.subject,
        textBody: payload.textBody,
        htmlBody: payload.htmlBody,
        templateId: payload.templateId,
        templateData: payload.templateData,
        configurationSetName: this.notifConfig.ses.configurationSetName, // Use default from config
      };

      const result = await this.sesAdapter.sendEmail(params);

      if (result.messageId) {
        this.logger.log(
          `Transactional email sent successfully. Message ID: ${result.messageId}`,
        );
        return { success: true, messageId: result.messageId };
      } else {
        const errorMessage = result.error?.message || (typeof result.error === 'string' ? result.error : 'Unknown SES error');
        this.logger.error(
          `Failed to send transactional email. Provider error: ${errorMessage}, Status Code: ${result.statusCode}`,
          result.error?.stack,
        );
        return {
          success: false,
          error: errorMessage,
          providerStatusCode: result.statusCode,
        };
      }
    } catch (error) {
      this.logger.error(
        `Exception during sendTransactionalEmail: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during email sending',
      };
    }
  }

  async publishSnsEvent(payload: PublishSnsEventDto): Promise<NotificationStatusDto> {
    this.logger.log(
      `Attempting to publish SNS event to topic: ${payload.topicArn}`,
    );

    // DTO validation is expected to be handled by NestJS ValidationPipe
    // at the entry point (e.g., controller or calling service).

    try {
      const params: IEventNotificationParams = {
        topicArn: payload.topicArn,
        message:
          typeof payload.message === 'string'
            ? payload.message
            : JSON.stringify(payload.message),
        subject: payload.subject,
        messageAttributes: payload.messageAttributes,
        messageDeduplicationId: payload.messageDeduplicationId,
        messageGroupId: payload.messageGroupId,
      };

      const result = await this.snsAdapter.publishEvent(params);

      if (result.messageId) {
        this.logger.log(
          `SNS event published successfully. Message ID: ${result.messageId}`,
        );
        return { success: true, messageId: result.messageId };
      } else {
        const errorMessage = result.error?.message || (typeof result.error === 'string' ? result.error : 'Unknown SNS error');
        this.logger.error(
          `Failed to publish SNS event. Provider error: ${errorMessage}, Status Code: ${result.statusCode}`,
          result.error?.stack,
        );
        return {
          success: false,
          error: errorMessage,
          providerStatusCode: result.statusCode,
        };
      }
    } catch (error) {
      this.logger.error(
        `Exception during publishSnsEvent: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during event publishing',
      };
    }
  }
}