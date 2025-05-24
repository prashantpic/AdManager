export class NotificationStatusDto {
  success: boolean;

  // Message ID from SES/SNS on success
  messageId?: string;

  // Error message on failure
  error?: string;

  // Status code from AWS SDK if applicable
  providerStatusCode?: number;
}