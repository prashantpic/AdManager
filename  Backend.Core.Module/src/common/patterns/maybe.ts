const SOME_BRAND = Symbol('Some');
const NONE_BRAND = Symbol('None');

/**
 * @description Represents an optional value that might be present (Some) or absent (None).
 */
export type Maybe<T> = Some<T> | None<T>;

/**
 * @description Represents the presence of a value.
 */
export class Some<T> {
  public readonly _brand = SOME_BRAND;
  private readonly value: T;

  constructor(value: T) {
    if (value === null || value === undefined) {
      throw new Error('Cannot create Some with null or undefined value. Use None instead.');
    }
    this.value = value;
  }

  public isSome(): this is Some<T> {
    return true;
  }

  public isNone(): this is None<T> {
    return false;
  }

  /**
   * Unwraps the value. Throws an error if called on a None.
   * @throws Error if this is a None (should not happen with Some).
   */
  public unwrap(): T {
    return this.value;
  }

  /**
   * Unwraps the value or returns a default value.
   */
  public unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Maps a Some<T> to Some<U> by applying a function to the contained value.
   * If the function returns null or undefined, the result will be None<U>.
   */
  public map<U>(fn: (value: T) => U | null | undefined): Maybe<U> {
    const mappedValue = fn(this.value);
    return mappedValue === null || mappedValue === undefined ? none() : some(mappedValue);
  }

  /**
   * Applies a function that returns a Maybe to the contained value.
   * Useful for chaining operations that might return None.
   */
  public flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    return fn(this.value);
  }

  /**
   * Executes a side-effecting function if the value is Some.
   */
  public ifSome(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Executes a side-effecting function if the value is None (no-op for Some).
   */
  public ifNone(_fn: () => void): this {
    return this;
  }
}

/**
 * @description Represents the absence of a value.
 */
export class None<T> {
  public readonly _brand = NONE_BRAND;

  constructor() {
    // No value to store
  }

  public isSome(): this is Some<T> {
    return false;
  }

  public isNone(): this is None<T> {
    return true;
  }

  /**
   * Unwraps the value. Throws an error because this is a None.
   * @throws Error
   */
  public unwrap(): T {
    throw new Error('Called unwrap on a None value');
  }

  /**
   * Unwraps the value or returns a default value.
   */
  public unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Maps a None<T> to None<U> (no-op for None).
   */
  public map<U>(_fn: (value: T) => U | null | undefined): Maybe<U> {
    return this as unknown as None<U>;
  }

  /**
   * Applies a function that returns a Maybe to the contained value (no-op for None).
   */
  public flatMap<U>(_fn: (value: T) => Maybe<U>): Maybe<U> {
    return this as unknown as None<U>;
  }

  /**
   * Executes a side-effecting function if the value is Some (no-op for None).
   */
  public ifSome(_fn: (value: T) => void): this {
    return this;
  }

  /**
   * Executes a side-effecting function if the value is None.
   */
  public ifNone(fn: () => void): this {
    fn();
    return this;
  }
}

// Singleton instance for None to avoid multiple allocations
const NONE_INSTANCE = new None<any>();

/**
 * Helper function to create a Some value.
 * Throws if value is null or undefined.
 */
export function some<T>(value: T): Some<T> {
  return new Some(value);
}

/**
 * Helper function to create a None value.
 */
export function none<T = never>(): None<T> {
  return NONE_INSTANCE as None<T>;
}

/**
 * Creates a Maybe from a potentially null or undefined value.
 */
export function fromNullable<T>(value: T | null | undefined): Maybe<T> {
  return value === null || value === undefined ? none<T>() : some(value);
}

/**
 * Type guard to check if a Maybe is Some.
 */
export function isSome<T>(maybe: Maybe<T>): maybe is Some<T> {
  return maybe.isSome();
}

/**
 * Type guard to check if a Maybe is None.
 */
export function isNone<T>(maybe: Maybe<T>): maybe is None<T> {
  return maybe.isNone();
}