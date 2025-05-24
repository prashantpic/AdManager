export const SUBSCRIPTION_CONFIG_TOKEN = Symbol('SUBSCRIPTION_CONFIG_TOKEN');
export const DUNNING_CONFIG_TOKEN = Symbol('DUNNING_CONFIG_TOKEN');

// Event names
export const PLAN_PRICE_CHANGED_EVENT = 'plan.price.changed';
export const SUBSCRIPTION_PAYMENT_FAILED_EVENT = 'subscription.payment.failed';
export const MERCHANT_SUBSCRIBED_EVENT = 'merchant.subscribed';
export const SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX = 'subscription.status'; // e.g., subscription.status.suspended