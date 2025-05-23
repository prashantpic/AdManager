// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IAppConfig } from '../../config/config.interface'; // Used for type inference

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends IAppConfig {}
  }
}

// If this file is not a module, it can be empty or just contain the global augmentation.
// To make it a module and avoid errors like "Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.",
// you can add an export statement.
export {};