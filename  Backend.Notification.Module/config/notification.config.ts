import { registerAs } from '@nestjs/config';

export interface NotificationConfig {
  awsRegion: string; // Default AWS region for SES/SNS clients. Read from `AWS_REGION` environment variable.
  ses: {
    region?: string; // Optional specific SES region. Read from `SES_REGION`. Defaults to `awsRegion`.
    defaultSender: string; // Default 'From' email address. Read from `SES_DEFAULT_SENDER_EMAIL`. Must be verified in SES.
    configurationSetName?: string; // Optional SES configuration set name. Read from `SES_CONFIGURATION_SET_NAME`.
  };
  sns: {
    region?: string; // Optional specific SNS region. Read from `SNS_REGION`. Defaults to `awsRegion`.
  };
}

export const notificationConfig = registerAs('notification', (): NotificationConfig => {
  const awsRegion = process.env.AWS_REGION || 'us-east-1'; // Provide a sensible default if AWS_REGION is not set

  return {
    awsRegion: awsRegion,
    ses: {
      region: process.env.SES_REGION || awsRegion,
      defaultSender: process.env.SES_DEFAULT_SENDER_EMAIL || 'no-reply@example.com', // Fallback
      configurationSetName: process.env.SES_CONFIGURATION_SET_NAME,
    },
    sns: {
      region: process.env.SNS_REGION || awsRegion,
    },
  };
});