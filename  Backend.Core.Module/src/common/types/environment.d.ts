// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IAppConfig } from '../../config/config.interface'; // Import to ensure IAppConfig is resolved

declare global {
  namespace NodeJS {
    // Extend ProcessEnv with the properties defined in IAppConfig
    // This provides type safety when accessing process.env
    // Note: Actual values are strings, conversion to number/boolean happens in ConfigService/validation.
    interface ProcessEnv extends Record<keyof IAppConfig, string | undefined> {
      // Explicitly defining a few common ones for clarity,
      // but the Record above makes it dynamic based on IAppConfig.
      NODE_ENV?: 'development' | 'production' | 'test' | string;
      PORT?: string; // Will be parsed to number
      LOG_LEVEL?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent' | string;
      AWS_REGION?: string;
      // Add other specific environment variables from IAppConfig here if needed for more specific typing
      // e.g. DATABASE_URL_SECRET_NAME?: string;
      // However, Record<keyof IAppConfig, string> should cover them generally.
    }
  }
}

// If this file doesn't import/export anything,
// you may need to add `export {};` to make it a module
// and allow global augmentation if your tsconfig settings require it.
export {};