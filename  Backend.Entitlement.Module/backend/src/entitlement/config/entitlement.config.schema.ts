import { IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EntitlementConfigSchema {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  ENTITLEMENT_CACHE_TTL_SECONDS: number = 3600;

  @IsBoolean()
  @Type(() => Boolean)
  ENABLE_GRACE_PERIOD_FOR_DOWNGRADES: boolean = false;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  DOWNGRADE_GRACE_PERIOD_DAYS: number = 7;
}