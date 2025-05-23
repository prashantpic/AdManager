// This file serves as a barrel file for common type definitions.
// It can re-export types defined in other .ts files within this directory,
// or declare utility types.
// For `environment.d.ts`, it primarily augments global NodeJS.ProcessEnv,
// so direct exports from it might not be common unless it also exports specific types.

// Example of a utility type that could be defined here:
// export type Nullable<T> = T | null | undefined;

// export * from './some-other-types'; // If you have other type definition files