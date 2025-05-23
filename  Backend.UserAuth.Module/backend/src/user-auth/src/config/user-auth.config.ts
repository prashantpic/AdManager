import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsInt,
  IsBoolean,
  Min,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { transformAndValidateSync } from 'class-transformer-validator';

export interface UserAuthConfigInterface {
  jwtSecret: string;
  jwtExpiresIn: string;
  sessionSecret: string;
  sessionMaxAge: number;
  csrfEnabled: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  passwordHistoryCount: number;
  passwordExpiresDays: number;
  accountLockoutMaxAttempts: number;
  accountLockoutDurationMinutes: number;
  mfaIssuerName: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  cognitoRegion?: string;
}

// This class is used for validation via transformAndValidateSync,
// but the schema itself is defined in user-auth.config.schema.ts
// and applied globally via the ConfigModule.
// Here, we define it for the registerAs factory validation.
class EnvironmentVariables implements UserAuthConfigInterface {
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  SESSION_SECRET: string;

  @IsInt()
  @Min(60000) // 1 minute
  SESSION_MAX_AGE: number;

  @IsBoolean()
  CSRF_ENABLED: boolean;

  @IsInt()
  @Min(8)
  PASSWORD_MIN_LENGTH: number;

  @IsBoolean()
  PASSWORD_REQUIRE_UPPERCASE: boolean;

  @IsBoolean()
  PASSWORD_REQUIRE_LOWERCASE: boolean;

  @IsBoolean()
  PASSWORD_REQUIRE_NUMBER: boolean;

  @IsBoolean()
  PASSWORD_REQUIRE_SPECIAL: boolean;

  @IsInt()
  @Min(0)
  PASSWORD_HISTORY_COUNT: number;

  @IsInt()
  @Min(0) // 0 means never expires
  PASSWORD_EXPIRES_DAYS: number;

  @IsInt()
  @Min(1)
  ACCOUNT_LOCKOUT_MAX_ATTEMPTS: number;

  @IsInt()
  @Min(1)
  ACCOUNT_LOCKOUT_DURATION_MINUTES: number;

  @IsString()
  @IsNotEmpty()
  MFA_ISSUER_NAME: string;

  @IsOptional()
  @IsString()
  COGNITO_USER_POOL_ID?: string;

  @IsOptional()
  @IsString()
  COGNITO_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  COGNITO_REGION?: string;

  // Mapped properties
  jwtSecret: string;
  jwtExpiresIn: string;
  sessionSecret: string;
  sessionMaxAge: number;
  csrfEnabled: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  passwordHistoryCount: number;
  passwordExpiresDays: number;
  accountLockoutMaxAttempts: number;
  accountLockoutDurationMinutes: number;
  mfaIssuerName: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  cognitoRegion?: string;
}


export const USER_AUTH_CONFIG_NAMESPACE = 'user_auth';

export default registerAs(USER_AUTH_CONFIG_NAMESPACE, (): UserAuthConfigInterface => {
  const env = {
    JWT_SECRET: process.env.USER_AUTH_JWT_SECRET,
    JWT_EXPIRES_IN: process.env.USER_AUTH_JWT_EXPIRES_IN || '3600s',
    SESSION_SECRET: process.env.USER_AUTH_SESSION_SECRET,
    SESSION_MAX_AGE: parseInt(process.env.USER_AUTH_SESSION_MAX_AGE || (3600 * 1000).toString(), 10), // 1 hour in ms
    CSRF_ENABLED: process.env.USER_AUTH_CSRF_ENABLED === 'true',
    PASSWORD_MIN_LENGTH: parseInt(process.env.USER_AUTH_PASSWORD_MIN_LENGTH || '8', 10),
    PASSWORD_REQUIRE_UPPERCASE: process.env.USER_AUTH_PASSWORD_REQUIRE_UPPERCASE === 'true',
    PASSWORD_REQUIRE_LOWERCASE: process.env.USER_AUTH_PASSWORD_REQUIRE_LOWERCASE === 'true',
    PASSWORD_REQUIRE_NUMBER: process.env.USER_AUTH_PASSWORD_REQUIRE_NUMBER === 'true',
    PASSWORD_REQUIRE_SPECIAL: process.env.USER_AUTH_PASSWORD_REQUIRE_SPECIAL === 'true',
    PASSWORD_HISTORY_COUNT: parseInt(process.env.USER_AUTH_PASSWORD_HISTORY_COUNT || '3', 10),
    PASSWORD_EXPIRES_DAYS: parseInt(process.env.USER_AUTH_PASSWORD_EXPIRES_DAYS || '90', 10), // 0 for never
    ACCOUNT_LOCKOUT_MAX_ATTEMPTS: parseInt(process.env.USER_AUTH_ACCOUNT_LOCKOUT_MAX_ATTEMPTS || '5', 10),
    ACCOUNT_LOCKOUT_DURATION_MINUTES: parseInt(process.env.USER_AUTH_ACCOUNT_LOCKOUT_DURATION_MINUTES || '15', 10),
    MFA_ISSUER_NAME: process.env.USER_AUTH_MFA_ISSUER_NAME || 'AdManagerPlatform',
    COGNITO_USER_POOL_ID: process.env.USER_AUTH_COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.USER_AUTH_COGNITO_CLIENT_ID,
    COGNITO_REGION: process.env.USER_AUTH_COGNITO_REGION,
  };

  // Validate the environment variables during registration.
  // The global validation schema (user-auth.config.schema.ts) will be used by ConfigModule.
  // This is an additional check at the point of `registerAs`.
  const validatedConfig = transformAndValidateSync(EnvironmentVariables, env, {
    validator: { skipMissingProperties: false, forbidUnknownValues: true }, // Be strict
    transformer: { enableImplicitConversion: true } // Allows string to number/boolean conversion
  });


  return {
    jwtSecret: validatedConfig.JWT_SECRET,
    jwtExpiresIn: validatedConfig.JWT_EXPIRES_IN,
    sessionSecret: validatedConfig.SESSION_SECRET,
    sessionMaxAge: validatedConfig.SESSION_MAX_AGE,
    csrfEnabled: validatedConfig.CSRF_ENABLED,
    passwordMinLength: validatedConfig.PASSWORD_MIN_LENGTH,
    passwordRequireUppercase: validatedConfig.PASSWORD_REQUIRE_UPPERCASE,
    passwordRequireLowercase: validatedConfig.PASSWORD_REQUIRE_LOWERCASE,
    passwordRequireNumber: validatedConfig.PASSWORD_REQUIRE_NUMBER,
    passwordRequireSpecial: validatedConfig.PASSWORD_REQUIRE_SPECIAL,
    passwordHistoryCount: validatedConfig.PASSWORD_HISTORY_COUNT,
    passwordExpiresDays: validatedConfig.PASSWORD_EXPIRES_DAYS,
    accountLockoutMaxAttempts: validatedConfig.ACCOUNT_LOCKOUT_MAX_ATTEMPTS,
    accountLockoutDurationMinutes: validatedConfig.ACCOUNT_LOCKOUT_DURATION_MINUTES,
    mfaIssuerName: validatedConfig.MFA_ISSUER_NAME,
    cognitoUserPoolId: validatedConfig.COGNITO_USER_POOL_ID,
    cognitoClientId: validatedConfig.COGNITO_CLIENT_ID,
    cognitoRegion: validatedConfig.COGNITO_REGION,
  };
});