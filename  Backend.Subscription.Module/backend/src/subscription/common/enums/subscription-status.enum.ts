export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING', // e.g. waiting for initial payment confirmation
  CANCELLED = 'CANCELLED', // User initiated, access until end of period
  PAST_DUE = 'PAST_DUE', // Payment failed, in dunning
  SUSPENDED = 'SUSPENDED', // Access restricted after dunning period
  TERMINATED = 'TERMINATED', // Subscription ended, access revoked
}