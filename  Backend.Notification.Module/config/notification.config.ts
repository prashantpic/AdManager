import { registerAs } from '@nestjs/config';

export interface NotificationConfig {
  awsRegion?: string; // Default AWS region
  ses: {
    region?: string; // Specific SES region (overrides awsRegion)
    defaultSender: string; // Default sender email
    configurationSetName?: string; // Default configuration set name
  };
  sns: {
    region?: string; // Specific SNS region (overrides awsRegion)
  };
}

export const notificationConfig = registerAs('notification', (): NotificationConfig => ({
  awsRegion: process.env.AWS_REGION, // e.g., from main app config
  ses: {
    region: process.env.SES_REGION,
    defaultSender: process.env.SES_DEFAULT_SENDER_EMAIL || 'no-reply@example.com', // Fallback to a default
    configurationSetName: process.env.SES_CONFIGURATION_SET_NAME,
  },
  sns: {
    region: process.env.SNS_REGION,
  },
}));