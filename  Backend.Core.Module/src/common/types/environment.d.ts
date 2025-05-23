/**
 * @file TypeScript declaration file to provide strong typing for process.env variables.
 * @namespace NodeJS
 * @description This file augments the global NodeJS.ProcessEnv interface.
 *              It should reflect the properties defined in IAppConfig.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
import { IAppConfig } from '../../config/config.interface'; // Adjust path as necessary

declare global {
  namespace NodeJS {
    // It's often better to use `ConfigService<IAppConfig>` for type safety
    // rather than directly relying on `process.env` types everywhere.
    // However, this provides basic typing if `process.env` is accessed directly.
    // This should ideally mirror the structure of IAppConfig.
    interface ProcessEnv extends Partial<IAppConfig> {
      NODE_ENV?: 'development' | 'production' | 'test' | 'staging';
      PORT?: string; // Port is usually a string in process.env, convert to number in config service
      AWS_REGION?: string;
      // Add other key environment variables that might be accessed directly
      // before CoreConfigService is available, or for scripts.
      // However, primary source of truth for types is IAppConfig.
    }
  }
}

// This export is necessary to treat this file as a module,
// especially if you have "isolatedModules": true in tsconfig.json.
// It doesn't export any value but signals to TypeScript that this file is a module.
export {};