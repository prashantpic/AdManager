export interface IEmailNotificationParams {
  to: string[];
  from: string; // This will be overridden by defaultSender if not provided at service level
  replyTo?: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  configurationSetName?: string;
}