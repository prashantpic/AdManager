/**
 * @description Represents a successful outcome of an operation.
 */
export class Ok<T, E = never> {
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  public isOk(): this is Ok<T, E> {
    return true;
  }

  public isErr(): this is Err<E, T> {
    return false;
  }

  /**
   * Unwraps the value. Throws an error if called on an Err.
   * @throws Error if this is an Err.
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
   * Unwraps the error. Throws an error if called on an Ok.
   * @throws Error if this is an Ok.
   */
  public unwrapErr(): E {
    throw new Error('Called unwrapErr on an Ok value');
  }

  /**
   * Maps an Ok<T, E> to Ok<U, E> by applying a function to the contained Ok value.
   */
  public map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }

  /**
   * Maps an Ok<T, E> to Ok<T, F> by applying a function to the contained Err value (no-op for Ok).
   */
  public mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return this as unknown as Result<T, F>; // Safe cast as E is never used here
  }

  /**
   * Calls the provided function `fn` if the result is Ok, otherwise returns the Err value of self.
   */
  public andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
}

/**
 * @description Represents a failed outcome of an operation.
 */
export class Err<E, T = never> {
  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  public isOk(): this is Ok<T, E> {
    return false;
  }

  public isErr(): this is Err<E, T> {
    return true;
  }

  /**
   * Unwraps the value. Throws an error because this is an Err.
   * @throws Error (this.error)
   */
  public unwrap(): T {
    if (this.error instanceof Error) {
      throw this.error;
    }
    throw new Error(String(this.error) || 'Called unwrap on an Err value');
  }

  /**
   * Unwraps the value or returns a default value.
   */
  public unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Unwraps the error.
   */
  public unwrapErr(): E {
    return this.error;
  }

  /**
   * Maps an Err<E, T> to Err<E, U> by applying a function to the contained Ok value (no-op for Err).
   */
  public map<U>(_fn: (value: T) => U): Result<U, E> {
    return this as unknown as Result<U, E>; // Safe cast as T is never used here
  }

  /**
   * Maps an Err<E, T> to Err<F, T> by applying a function to the contained Err value.
   */
  public mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err(fn(this.error));
  }

  /**
   * Calls the provided function `fn` if the result is Ok (no-op for Err), otherwise returns the Err value of self.
   */
  public andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return this as unknown as Result<U, E>;
  }
}

/**
 * @description Represents a value that is either a success (Ok) or a failure (Err).
 */
export type Result<T, E> = Ok<T, E> | Err<E, T>;

/**
 * Helper function to create an Ok result.
 */
export function ok<T, E = never>(value: T): Ok<T, E> {
  return new Ok(value);
}

/**
 * Helper function to create an Err result.
 */
export function err<E, T = never>(error: E): Err<E, T> {
  return new Err(error);
}

/**
 * Type guard to check if a Result is Ok.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
  return result.isOk();
}

/**
 * Type guard to check if a Result is Err.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E, T> {
  return result.isErr();
}