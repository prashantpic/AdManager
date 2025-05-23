/**
 * @file Implementation of the Maybe (Option) pattern for handling optional values.
 * Provides Some and None types to represent the presence or absence of a value.
 */

const NONE_SYMBOL = Symbol('None');

/**
 * Represents the absence of a value.
 */
export class NoneImpl {
  private readonly _symbol: typeof NONE_SYMBOL = NONE_SYMBOL; // To make it a unique type

  isSome(): this is Some<never> {
    return false;
  }

  isNone(): this is NoneImpl {
    return true;
  }

  /**
   * Returns the contained Some value.
   * Throws an error if called on a None.
   */
  unwrap(): never {
    throw new Error('Called unwrap on a None value');
  }

  /**
   * Returns the contained Some value or a provided default.
   */
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Returns the contained Some value or computes it from a function.
   */
  unwrapOrElse<T>(fn: () => T): T {
    return fn();
  }

  /**
   * Maps a Some<T> to Some<U> by applying a function to a contained Some value,
   * or returns None if the Maybe is None.
   */
  map<U>(_fn: (value: never) => U): Maybe<U> {
    return this as unknown as NoneImpl;
  }

  /**
   * Applies a function to the contained Some value, or returns a default if None.
   */
  mapOr<U>(defaultValue: U, _fn: (value: never) => U): U {
    return defaultValue;
  }

  /**
   * Applies a function to the contained Some value, or computes a default if None.
   */
  mapOrElse<U>(defaultFn: () => U, _fn: (value: never) => U): U {
    return defaultFn();
  }

  /**
   * Returns None if the option is None, otherwise calls predicate with the wrapped value
   * and returns Some(t) if predicate returns true, and None otherwise.
   */
  filter(_predicate: (value: never) => boolean): Maybe<never> {
    return this;
  }

  /**
   * Returns the option if it contains a value, otherwise returns optb.
   */
  or<T>(optb: Maybe<T>): Maybe<T> {
    return optb;
  }

  /**
   * Returns the option if it contains a value, otherwise calls f and returns the result.
   */
  orElse<T>(fn: () => Maybe<T>): Maybe<T> {
    return fn();
  }

  /**
   * Calls the provided function with the contained value (if Some) and returns this.
   */
  tap(_fn: (value: never) => void): this {
    return this;
  }
}

/**
 * Represents the presence of a value.
 */
export class Some<T> {
  public readonly value: T;

  constructor(value: T) {
    if (value === null || value === undefined) {
      throw new Error('Some value cannot be null or undefined. Use None for absence.');
    }
    this.value = value;
  }

  isSome(): this is Some<T> {
    return true;
  }

  isNone(): this is NoneImpl {
    return false;
  }

  /**
   * Returns the contained Some value.
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Returns the contained Some value or a provided default.
   */
  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Returns the contained Some value or computes it from a function.
   */
  unwrapOrElse(_fn: () => T): T {
    return this.value;
  }

  /**
   * Maps a Some<T> to Some<U> by applying a function to a contained Some value.
   * If the function returns null or undefined, the result is None.
   */
  map<U>(fn: (value: T) => U | null | undefined): Maybe<U> {
    const newValue = fn(this.value);
    return newValue === null || newValue === undefined ? None : new Some(newValue);
  }

  /**
   * Applies a function to the contained Some value, or returns a default if None.
   */
  mapOr<U>(_defaultValue: U, fn: (value: T) => U): U {
    return fn(this.value);
  }

  /**
   * Applies a function to the contained Some value, or computes a default if None.
   */
  mapOrElse<U>(_defaultFn: () => U, fn: (value: T) => U): U {
    return fn(this.value);
  }

  /**
   * Returns None if the option is None, otherwise calls predicate with the wrapped value
   * and returns Some(t) if predicate returns true, and None otherwise.
   */
  filter(predicate: (value: T) => boolean): Maybe<T> {
    return predicate(this.value) ? this : None;
  }

  /**
   * Returns the option if it contains a value, otherwise returns optb.
   */
  or(_optb: Maybe<T>): Maybe<T> {
    return this;
  }

  /**
   * Returns the option if it contains a value, otherwise calls f and returns the result.
   */
  orElse(_fn: () => Maybe<T>): Maybe<T> {
    return this;
  }

  /**
   * Calls the provided function with the contained value (if Some) and returns this.
   */
  tap(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }
}

/**
 * The singleton instance of None.
 */
export const None: NoneImpl = new NoneImpl();

/**
 * The Maybe type, which can be either Some or None.
 */
export type Maybe<T> = Some<T> | NoneImpl;

/**
 * Helper function to create a Maybe from a value that might be null or undefined.
 * @param value The value to wrap.
 * @returns Some<T> if the value is not null or undefined, otherwise None.
 */
export function maybe<T>(value: T | null | undefined): Maybe<T> {
  return value === null || value === undefined ? None : new Some(value);
}