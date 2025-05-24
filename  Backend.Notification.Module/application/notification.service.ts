import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { SesAdapter } from '../infrastructure/ses/ses.adapter';
import { SnsAdapter } from '../infrastructure/sns/sns.adapter';
import { SendEmailDto } from './dto/send-email.dto';
import { PublishSnsEventDto } from './dto/publish-sns-event.dto';
import { NotificationStatusDto } from './dto/notification-status.dto';
import { IEmailNotificationParams } from '../domain/interfaces/email-notification-params.interface';
import { IEventNotificationParams } from '../domain/interfaces/event-notification-params.interface';

@Injectable()
export class NotificationService {
  constructor(
    private readonly sesAdapter: SesAdapter,
    private readonly snsAdapter: SnsAdapter,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.logger.setContext(NotificationService.name);
  }

  async sendTransactionalEmail(payload: SendEmailDto): Promise<NotificationStatusDto> {
    this.logger.log(
      `Attempting to send transactional email. Subject: "${payload.subject}", To: "${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}"`,
    );

    try {
      // Basic check for content, as SES requires either body or template
      if (!payload.templateId && !payload.htmlBody && !payload.textBody) {
        const errorMsg = 'Email must contain templateId, htmlBody, or textBody.';
        this.logger.warn(errorMsg, payload);
        throw new BadRequestException(errorMsg);
      }

      const params: IEmailNotificationParams = {
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        from: payload.from, // Adapter will use default sender if this is undefined
        replyTo: payload.replyTo
          ? Array.isArray(payload.replyTo)
            ? payload.replyTo
            : [payload.replyTo]
          : undefined,
        subject: payload.subject,
        textBody: payload.textBody,
        htmlBody: payload.htmlBody,
        templateId: payload.templateId,
        templateData: payload.templateData,
        // configurationSetName will be picked up by the adapter from its own config if not provided or if params.configurationSetName is undefined
      };

      const result = await this.sesAdapter.sendEmail(params);

      if (result.messageId) {
        this.logger.log(`Transactional email sent successfully. Message ID: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } else {
        const errorMessage = result.error?.message || JSON.stringify(result.error) || 'Unknown SES error';
        this.logger.error(`Failed to send transactional email: ${errorMessage}`, result.error?.stack);
        return {
          success: false,
          error: errorMessage,
          providerStatusCode: result.statusCode,
        };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred while sending email.';
      this.logger.error(`Exception during sendTransactionalEmail: ${errorMessage}`, error.stack);
      // Capture a generic status code for internal exceptions if not provided by a downstream component like BadRequestException
      const statusCode = error.status || error.statusCode || 500;
      return { success: false, error: errorMessage, providerStatusCode: statusCode };
    }
  }

  async publishSnsEvent(payload: PublishSnsEventDto): Promise<NotificationStatusDto> {
    this.logger.log(`Attempting to publish SNS event. Topic ARN: "${payload.topicArn}"`);

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
        const errorMessage = result.error?.message || JSON.stringify(result.error) || 'Unknown SNS error';
        this.logger.error(`Failed to publish SNS event: ${errorMessage}`, result.error?.stack);
        return {
          success: false,
          error: errorMessage,
          providerStatusCode: result.statusCode,
        };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred while publishing SNS event.';
      this.logger.error(`Exception during publishSnsEvent: ${errorMessage}`, error.stack);
      const statusCode = error.status || error.statusCode || 500;
      return { success: false, error: errorMessage, providerStatusCode: statusCode };
    }
  }
}