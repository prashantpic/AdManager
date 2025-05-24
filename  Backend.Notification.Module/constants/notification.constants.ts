// Used if config is missing or SES_DEFAULT_SENDER_EMAIL is not set
export const DEFAULT_SES_SENDER_FALLBACK = 'no-reply@example.com';

// Potential timeout for SNS SDK calls, although AWS SDK handles this internally with its own defaults and retry strategies.
// This constant might be used for custom application-level timeouts if needed.
export const SNS_PUBLISH_TIMEOUT_MS = 5000;

// Maximum length for an SNS message subject.
// See: https://docs.aws.amazon.com/sns/latest/api/API_Publish.html
export const MAX_SNS_SUBJECT_LENGTH = 100;

// Informational constant for the header AWS SES adds to emails, not directly used in adapter logic for sending
// but could be useful for logging or processing incoming webhooks related to SES.
export const SES_MESSAGE_ID_HEADER = 'X-SES-Message-ID';