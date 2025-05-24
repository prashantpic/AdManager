import { registerAs } from '@nestjs/config';

export const paymentConfig = registerAs('payment', () => ({
  defaultDunningAttempts: parseInt(process.env.DEFAULT_DUNNING_ATTEMPTS || '3', 10),
  defaultDunningIntervalDays: (process.env.DEFAULT_DUNNING_INTERVAL_DAYS || '3,5,7').split(',').map(days => parseInt(days.trim(), 10)),
  logLevel: process.env.PAYMENT_LOG_LEVEL || 'info',

  // Feature flags
  enableStripeGateway: process.env.ENABLE_STRIPE_GATEWAY === 'true',
  enablePayPalGateway: process.env.ENABLE_PAYPAL_GATEWAY === 'true',
  enableMadaGateway: process.env.ENABLE_MADA_GATEWAY === 'true',
  enableStcPayGateway: process.env.ENABLE_STCPAY_GATEWAY === 'true',
  enableRecurringBillingForMerchantProducts: process.env.ENABLE_RECURRING_BILLING === 'true',
  enableAutomatedDunningProcess: process.env.ENABLE_AUTOMATED_DUNNING === 'true',

  // Security Configs (secrets should ideally be managed by CoreModule.ConfigService which fetches from Secrets Manager)
  // These are placeholders; actual secret fetching should happen via injected ConfigService
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  paypalWebhookSecret: process.env.PAYPAL_WEBHOOK_SECRET,
  madaWebhookSecret: process.env.MADA_WEBHOOK_SECRET,
  stcPayWebhookSecret: process.env.STCPAY_WEBHOOK_SECRET,
}));

export type PaymentConfig = ReturnType<typeof paymentConfig>;