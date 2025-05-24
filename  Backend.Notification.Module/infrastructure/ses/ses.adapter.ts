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
    @Inject(notificationConfig.KEY) private readonly notifConfig: NotificationConfig,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    const region = this.notifConfig.ses.region || this.notifConfig.awsRegion;
    this.sesClient = new SESClient({
      region: region,
      // Credentials should be handled by the execution environment (e.g., IAM role)
    });
    this.defaultSender = this.notifConfig.ses.defaultSender || DEFAULT_SES_SENDER_FALLBACK;
    this.configurationSetName = this.notifConfig.ses.configurationSetName;

    this.logger.log(`SesAdapter initialized. Region: ${region}, Default Sender: ${this.defaultSender}, ConfigSet: ${this.configurationSetName || 'N/A'}`, SesAdapter.name);
  }

  async sendEmail(params: IEmailNotificationParams): Promise<{ messageId?: string; error?: any; statusCode?: number }> {
    this.logger.log(`Attempting to send email. Subject: ${params.subject}, To: ${params.to.join(', ')}`, SesAdapter.name);

    const sourceEmail = params.from || this.defaultSender;

    try {
      if (params.templateId) {
        const commandInput: SendTemplatedEmailCommandInput = {
          Source: sourceEmail,
          Destination: {
            ToAddresses: params.to,
            CcAddresses: [], // Add if needed
            BccAddresses: [], // Add if needed
          },
          ReplyToAddresses: params.replyTo,
          Template: params.templateId,
          TemplateData: params.templateData ? JSON.stringify(params.templateData) : '{}',
          ConfigurationSetName: params.configurationSetName || this.configurationSetName,
        };
        const command = new SendTemplatedEmailCommand(commandInput);
        const result: SendTemplatedEmailCommandOutput = await this.sesClient.send(command);
        this.logger.log(`Templated email sent successfully. MessageId: ${result.MessageId}`, SesAdapter.name);
        return { messageId: result.MessageId, statusCode: result.$metadata.httpStatusCode };
      } else {
        const commandInput: SendEmailCommandInput = {
          Source: sourceEmail,
          Destination: {
            ToAddresses: params.to,
            CcAddresses: [], // Add if needed
            BccAddresses: [], // Add if needed
          },
          ReplyToAddresses: params.replyTo,
          Message: {
            Subject: {
              Data: params.subject,
              Charset: 'UTF-8',
            },
            Body: {},
          },
          ConfigurationSetName: params.configurationSetName || this.configurationSetName,
        };

        if (params.textBody) {
          commandInput.Message.Body.Text = {
            Data: params.textBody,
            Charset: 'UTF-8',
          };
        }
        if (params.htmlBody) {
          commandInput.Message.Body.Html = {
            Data: params.htmlBody,
            Charset: 'UTF-8',
          };
        }

        if (!params.textBody && !params.htmlBody) {
          const errorMsg = 'Email must contain either textBody or htmlBody if not using a template.';
          this.logger.error(errorMsg, SesAdapter.name);
          return { error: { message: errorMsg }, statusCode: 400 };
        }

        const command = new SendEmailCommand(commandInput);
        const result: SendEmailCommandOutput = await this.sesClient.send(command);
        this.logger.log(`Raw email sent successfully. MessageId: ${result.MessageId}`, SesAdapter.name);
        return { messageId: result.MessageId, statusCode: result.$metadata.httpStatusCode };
      }
    } catch (error) {
      this.logger.error(`Error sending email via SES: ${error.message}`, error.stack, SesAdapter.name);
      return {
        error: { message: error.message, name: error.name, stack: error.stack },
        statusCode: error.$metadata?.httpStatusCode || 500,
      };
    }
  }
}