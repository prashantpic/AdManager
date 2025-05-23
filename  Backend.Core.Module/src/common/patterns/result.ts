/**
 * @file Implementation of the Result pattern for functional error handling.
 * Provides Ok and Err types to represent successful or failed outcomes.
 */

/**
 * Represents a successful outcome.
 */
export class Ok<T, E = never> {
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  /**
   * Returns the contained Ok value.
   * Throws an error if called on an Err.
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Returns the contained Ok value or a provided default.
   */
  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Returns the contained Err value.
   * Throws an error if called on an Ok.
   */
  unwrapErr(): E {
    throw new Error('Called unwrapErr on an Ok value');
  }

  /**
   * Maps an Ok<T, E> to Ok<U, E> by applying a function to a contained Ok value,
   * leaving an Err value untouched.
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to a contained Err value,
   * leaving an Ok value untouched.
   */
  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return this as unknown as Ok<T, F>; // Remains Ok<T>, F is only relevant for Err
  }

  /**
   * Applies a function to the contained Ok value, or returns the default if Err.
   */
  mapOr<U>(_defaultValue: U, fn: (value: T) => U): U {
    return fn(this.value);
  }

  /**
   * Applies a function to the contained Ok value, or computes a default if Err.
   */
  mapOrElse<U>(_defaultFn: (error: E) => U, fn: (value: T) => U): U {
    return fn(this.value);
  }

  /**
   * Calls the provided function with the contained value (if Ok) and returns this.
   */
  tap(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Calls the provided function with the contained error (if Err) and returns this.
   */
  tapErr(_fn: (error: E) => void): this {
    return this;
  }
}

/**
 * Represents a failed outcome.
 */
export class Err<E, T = never> {
  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<E, T> {
    return true;
  }

  /**
   * Returns the contained Ok value.
   * Throws an error if called on an Err.
   */
  unwrap(): T {
    throw new Error(`Called unwrap on an Err value: ${JSON.stringify(this.error)}`);
  }

  /**
   * Returns the contained Ok value or a provided default.
   */
  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Returns the contained Err value.
   */
  unwrapErr(): E {
    return this.error;
  }

  /**
   * Maps an Ok<T, E> to Ok<U, E> by applying a function to a contained Ok value,
   * leaving an Err value untouched.
   */
  map<U>(_fn: (value: T) => U): Result<U, E> {
    return this as unknown as Err<E, U>; // Remains Err<E>, U is only relevant for Ok
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to a contained Err value,
   * leaving an Ok value untouched.
   */
  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err(fn(this.error));
  }

  /**
   * Applies a function to the contained Ok value, or returns the default if Err.
   */
  mapOr<U>(defaultValue: U, _fn: (value: T) => U): U {
    return defaultValue;
  }

  /**
   * Applies a function to the contained Ok value, or computes a default if Err.
   */
  mapOrElse<U>(defaultFn: (error: E) => U, _fn: (value: T) => U): U {
    return defaultFn(this.error);
  }

  /**
   * Calls the provided function with the contained value (if Ok) and returns this.
   */
  tap(_fn: (value: T) => void): this {
    return this;
  }

  /**
   * Calls the provided function with the contained error (if Err) and returns this.
   */
  tapErr(fn: (error: E) => void): this {
    fn(this.error);
    return this;
  }
}

/**
 * The Result type, which can be either Ok or Err.
 */
export type Result<T, E> = Ok<T, E> | Err<E, T>;

/**
 * Helper function to create an Ok result.
 */
export const ok = <T, E = never>(value: T): Ok<T, E> => new Ok(value);

/**
 * Helper function to create an Err result.
 */
export const err = <E, T = never>(error: E): Err<E, T> => new Err(error);