import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
  SendEmailCommandOutput,
  SendTemplatedEmailCommand,
  SendTemplatedEmailCommandInput,
  SendTemplatedEmailCommandOutput,
} from '@aws-sdk/client-ses';
import { IEmailNotificationParams } from '../../domain/interfaces/email-notification-params.interface';
import { NotificationConfig } from '../../config/notification.config';
import { DEFAULT_SES_SENDER_FALLBACK } from '../../constants/notification.constants';

@Injectable()
export class SesAdapter {
  private readonly sesClient: SESClient;
  private readonly defaultSender: string;
  private readonly configurationSetName?: string;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService<NotificationConfig>,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    const notificationConfigValues = this.configService.get<NotificationConfig['ses']>('ses', { infer: true });
    const rootAwsRegion = this.configService.get<string>('awsRegion', { infer: true });

    const region = notificationConfigValues.region || rootAwsRegion;
    this.defaultSender = notificationConfigValues.defaultSender || DEFAULT_SES_SENDER_FALLBACK;
    this.configurationSetName = notificationConfigValues.configurationSetName;

    if (!region) {
      const errorMsg = 'AWS region for SES is not configured.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    if (!this.defaultSender) {
        const errorMsg = 'Default SES sender email is not configured.';
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
    }

    this.sesClient = new SESClient({ region });
    this.logger.log(`SesAdapter initialized. Region: ${region}, Default Sender: ${this.defaultSender}, ConfigSet: ${this.configurationSetName || 'N/A'}`);
  }

  async sendEmail(params: IEmailNotificationParams): Promise<{ messageId?: string; error?: any; statusCode?: number }> {
    this.logger.log(`Attempting to send email via SES. Subject: ${params.subject}, To: ${params.to.join(', ')}`);

    const source = params.from || this.defaultSender;

    try {
      let response: SendEmailCommandOutput | SendTemplatedEmailCommandOutput;

      if (params.templateId) {
        if (!params.templateData) {
            this.logger.warn(`Sending templated email without templateData for templateId: ${params.templateId}`);
        }
        const commandInput: SendTemplatedEmailCommandInput = {
          Source: source,
          Destination: { ToAddresses: params.to },
          Template: params.templateId,
          TemplateData: JSON.stringify(params.templateData || {}),
        };
        if (params.replyTo && params.replyTo.length > 0) {
          commandInput.ReplyToAddresses = params.replyTo;
        }
        if (params.configurationSetName || this.configurationSetName) {
            commandInput.ConfigurationSetName = params.configurationSetName || this.configurationSetName;
        }
        this.logger.debug('Sending templated email with input:', JSON.stringify(commandInput, null, 2));
        response = await this.sesClient.send(new SendTemplatedEmailCommand(commandInput));

      } else if (params.htmlBody || params.textBody) {
        const messageBody: SendEmailCommandInput['Message']['Body'] = {};
        if (params.htmlBody) {
          messageBody.Html = { Data: params.htmlBody, Charset: 'UTF-8' };
        }
        if (params.textBody) {
          messageBody.Text = { Data: params.textBody, Charset: 'UTF-8' };
        }

        const commandInput: SendEmailCommandInput = {
          Source: source,
          Destination: { ToAddresses: params.to },
          Message: {
            Subject: { Data: params.subject, Charset: 'UTF-8' },
            Body: messageBody,
          },
        };
        if (params.replyTo && params.replyTo.length > 0) {
          commandInput.ReplyToAddresses = params.replyTo;
        }
        if (params.configurationSetName || this.configurationSetName) {
            commandInput.ConfigurationSetName = params.configurationSetName || this.configurationSetName;
        }
        this.logger.debug('Sending raw email with input:', JSON.stringify(commandInput, null, 2));
        response = await this.sesClient.send(new SendEmailCommand(commandInput));
      } else {
        const errorMsg = 'SES sendEmail requires either templateId or htmlBody/textBody.';
        this.logger.error(errorMsg);
        return { error: new Error(errorMsg), statusCode: 400 };
      }

      this.logger.log(`SES email sent successfully. MessageId: ${response.MessageId}`);
      return { messageId: response.MessageId, statusCode: response.$metadata.httpStatusCode };

    } catch (error) {
      this.logger.error(`Failed to send SES email. Subject: ${params.subject}. Error: ${error.message}`, error.stack);
      return {
        error: { name: error.name, message: error.message, stack: error.stack },
        statusCode: error.$metadata?.httpStatusCode,
      };
    }
  }
}