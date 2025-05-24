import { Injectable, Logger, Inject } from '@nestjs/common';
import { SesAdapter } from '../infrastructure/ses/ses.adapter';
import { SnsAdapter } from '../infrastructure/sns/sns.adapter';
import { SendEmailDto } from './dto/send-email.dto';
import { PublishSnsEventDto } from './dto/publish-sns-event.dto';
import { NotificationStatusDto } from './dto/notification-status.dto';
import { IEmailNotificationParams } from '../domain/interfaces/email-notification-params.interface';
import { IEventNotificationParams } from '../domain/interfaces/event-notification-params.interface';
import { notificationConfig } from '../config/notification.config';
import { ConfigType } from '@nestjs/config';

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
    this.logger.log(`Attempting to send transactional email with subject: "${payload.subject}" to: ${JSON.stringify(payload.to)}`);

    // Validate payload - Assuming ValidationPipe handles this at controller level
    // If not, class-validator's validate function could be used here explicitly.

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
        configurationSetName: this.notifConfig.ses.configurationSetName,
      };

      const result = await this.sesAdapter.sendEmail(params);

      if (result.messageId) {
        this.logger.log(`Email sent successfully via SES. Message ID: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } else {
        const errorMessage = result.error?.message || result.error?.toString() || 'Unknown SES error';
        this.logger.error(`Failed to send email via SES: ${errorMessage}`, result.error?.stack);
        return {
          success: false,
          error: errorMessage,
          providerStatusCode: result.statusCode,
        };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred during email sending';
      this.logger.error(`Exception while sending email: ${errorMessage}`, error.stack);
      return { success: false, error: errorMessage, providerStatusCode: error.$metadata?.httpStatusCode };
    }
  }

  async publishSnsEvent(payload: PublishSnsEventDto): Promise<NotificationStatusDto> {
    this.logger.log(`Attempting to publish SNS event to topic: ${payload.topicArn}`);

    // Validate payload - Assuming ValidationPipe handles this at controller level

    try {
      const params: IEventNotificationParams = {
        topicArn: payload.topicArn,
        message: typeof payload.message === 'string' ? payload.message : JSON.stringify(payload.message),
        subject: payload.subject,
        messageAttributes: payload.messageAttributes,
        messageDeduplicationId: payload.messageDeduplicationId,
        messageGroupId: payload.messageGroupId,
      };

      const result = await this.snsAdapter.publishEvent(params);

      if (result.messageId) {
        this.logger.log(`SNS event published successfully. Message ID: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } else {
        const errorMessage = result.error?.message || result.error?.toString() || 'Unknown SNS error';
        this.logger.error(`Failed to publish SNS event: ${errorMessage}`, result.error?.stack);
        return {
          success: false,
          error: errorMessage,
          providerStatusCode: result.statusCode,
        };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred during SNS event publishing';
      this.logger.error(`Exception while publishing SNS event: ${errorMessage}`, error.stack);
      return { success: false, error: errorMessage, providerStatusCode: error.$metadata?.httpStatusCode };
    }
  }
}