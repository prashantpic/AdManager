import { registerAs } from '@nestjs/config';

export interface EntitlementConfig {
  cacheTtlSeconds: number;
  enableGracePeriodForDowngrades: boolean;
  downgradeGracePeriodDays: number;
}

export const entitlementConfiguration = registerAs(
  'entitlement',
  (): EntitlementConfig => ({
    cacheTtlSeconds: parseInt(
      process.env.ENTITLEMENT_CACHE_TTL_SECONDS || '3600',
      10,
    ),
    enableGracePeriodForDowngrades:
      process.env.ENABLE_GRACE_PERIOD_FOR_DOWNGRADES === 'true',
    downgradeGracePeriodDays: parseInt(
      process.env.DOWNGRADE_GRACE_PERIOD_DAYS || '7',
      10,
    ),
  }),
);