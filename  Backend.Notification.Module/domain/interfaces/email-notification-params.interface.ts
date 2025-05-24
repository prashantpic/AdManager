export interface IEmailNotificationParams {
  to: string[];
  from: string; // This will be resolved by the service or adapter if not provided in DTO
  replyTo?: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  configurationSetName?: string;
}