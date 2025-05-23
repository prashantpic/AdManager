import {
  IsString,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserAuthConfigSchema {
  @IsString()
  @IsNotEmpty({ message: 'USER_AUTH_JWT_SECRET must be defined' })
  USER_AUTH_JWT_SECRET: string;

  @IsString()
  @IsNotEmpty({ message: 'USER_AUTH_JWT_EXPIRES_IN must be defined' })
  USER_AUTH_JWT_EXPIRES_IN: string; // e.g., '60s', '1h', '7d'

  @IsString()
  @IsNotEmpty({ message: 'USER_AUTH_SESSION_SECRET must be defined' })
  USER_AUTH_SESSION_SECRET: string;

  @IsInt()
  @Type(() => Number)
  @Min(60000, { message: 'USER_AUTH_SESSION_MAX_AGE must be at least 60000 (1 minute in ms)' }) // 1 minute in ms
  USER_AUTH_SESSION_MAX_AGE: number;

  @IsBoolean()
  @Type(() => Boolean)
  USER_AUTH_CSRF_ENABLED: boolean;

  @IsInt()
  @Type(() => Number)
  @Min(6, { message: 'USER_AUTH_PASSWORD_MIN_LENGTH must be at least 6' })
  @Max(128, { message: 'USER_AUTH_PASSWORD_MIN_LENGTH must be at most 128' })
  USER_AUTH_PASSWORD_MIN_LENGTH: number;

  @IsBoolean()
  @Type(() => Boolean)
  USER_AUTH_PASSWORD_REQUIRE_UPPERCASE: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  USER_AUTH_PASSWORD_REQUIRE_LOWERCASE: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  USER_AUTH_PASSWORD_REQUIRE_NUMBER: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  USER_AUTH_PASSWORD_REQUIRE_SPECIAL: boolean;

  @IsInt()
  @Type(() => Number)
  @Min(0, { message: 'USER_AUTH_PASSWORD_HISTORY_COUNT must be 0 or greater' })
  @Max(10, { message: 'USER_AUTH_PASSWORD_HISTORY_COUNT must be 10 or less' })
  USER_AUTH_PASSWORD_HISTORY_COUNT: number;

  @IsInt()
  @Type(() => Number)
  @Min(0, { message: 'USER_AUTH_PASSWORD_EXPIRES_DAYS must be 0 or greater (0 means never expires)' }) // 0 means never expires
  USER_AUTH_PASSWORD_EXPIRES_DAYS: number;

  @IsInt()
  @Type(() => Number)
  @Min(1, { message: 'USER_AUTH_ACCOUNT_LOCKOUT_MAX_ATTEMPTS must be at least 1' })
  USER_AUTH_ACCOUNT_LOCKOUT_MAX_ATTEMPTS: number;

  @IsInt()
  @Type(() => Number)
  @Min(1, { message: 'USER_AUTH_ACCOUNT_LOCKOUT_DURATION_MINUTES must be at least 1' })
  USER_AUTH_ACCOUNT_LOCKOUT_DURATION_MINUTES: number;

  @IsString()
  @IsNotEmpty({ message: 'USER_AUTH_MFA_ISSUER_NAME must be defined' })
  USER_AUTH_MFA_ISSUER_NAME: string;

  @IsOptional()
  @IsString()
  USER_AUTH_COGNITO_USER_POOL_ID?: string;

  @IsOptional()
  @IsString()
  USER_AUTH_COGNITO_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  USER_AUTH_COGNITO_REGION?: string;
}