/**
 * @file Implementation of the Result pattern for functional error handling.
 * @namespace AdManager.Platform.Backend.Core.Common.Patterns
 */

export class Ok<T, E = unknown> {
  public readonly value: T;
  public readonly isOk = true;
  public readonly isErr = false;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Unwraps the value. Throws if it's an Err (though type system prevents this call on Err).
   */
  public unwrap(): T {
    return this.value;
  }

  /**
   * Unwraps the value or returns a default if it's an Err.
   */
  public unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Unwraps the error. Throws if it's an Ok.
   */
  public unwrapErr(): E {
    throw new Error('Cannot unwrapErr on Ok');
  }

  /**
   * Maps an Ok<T, E> to Ok<U, E> by applying a function to a contained Ok value.
   */
  public map<U>(fn: (value: T) => U): Ok<U, E> {
    return new Ok(fn(this.value));
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to a contained Err value.
   */
  public mapErr<F>(_fn: (error: E) => F): Ok<T, F> {
    // Type assertion needed as TypeScript doesn't know E and F are compatible here
    // within the context of `this` being Ok<T,E>.
    // The operation doesn't change the Ok value or its type T.
    // It only changes the *potential* error type F if this were an Err.
    return this as unknown as Ok<T, F>;
  }

  /**
   * Calls the provided function with the contained value if Ok, otherwise does nothing.
   * @param fn The function to call with the value.
   * @returns The original Ok instance.
   */
  public ifOk(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Does nothing if Ok.
   * @param _fn The function to call (not called for Ok).
   * @returns The original Ok instance.
   */
  public ifErr(_fn: (error: E) => void): this {
    // Do nothing for Ok
    return this;
  }
}

export class Err<E, T = unknown> {
  public readonly error: E;
  public readonly isOk = false;
  public readonly isErr = true;

  constructor(error: E) {
    this.error = error;
  }

  /**
   * Unwraps the value. Throws if it's an Err.
   */
  public unwrap(): T {
    throw this.error instanceof Error
      ? this.error
      : new Error(`Tried to unwrap an Err value: ${JSON.stringify(this.error)}`);
  }

  /**
   * Unwraps the value or returns a default if it's an Err.
   */
  public unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Unwraps the error. Throws if it's an Ok (though type system prevents this call on Ok).
   */
  public unwrapErr(): E {
    return this.error;
  }

  /**
   * Maps an Err<E, T> to Err<E, U> by applying a function to a contained Ok value.
   * This does nothing for Err, just returns itself.
   */
  public map<U>(_fn: (value: T) => U): Err<E, U> {
    // Type assertion similar to Ok.mapErr
    return this as unknown as Err<E, U>;
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to a contained Err value.
   */
  public mapErr<F>(fn: (error: E) => F): Err<F, T> {
    return new Err(fn(this.error));
  }

  /**
   * Does nothing if Err.
   * @param _fn The function to call (not called for Err).
   * @returns The original Err instance.
   */
  public ifOk(_fn: (value: T) => void): this {
    // Do nothing for Err
    return this;
  }

  /**
   * Calls the provided function with the contained error if Err, otherwise does nothing.
   * @param fn The function to call with the error.
   * @returns The original Err instance.
   */
  public ifErr(fn: (error: E) => void): this {
    fn(this.error);
    return this;
  }
}

export type Result<T, E> = Ok<T, E> | Err<E, T>;

export const ResultUtils = {
  ok: <T, E = unknown>(value: T): Ok<T, E> => new Ok(value),
  err: <E, T = unknown>(error: E): Err<E, T> => new Err(error),

  isOk: <T, E>(result: Result<T, E>): result is Ok<T, E> => result.isOk,
  isErr: <T, E>(result: Result<T, E>): result is Err<E, T> => result.isErr,

  /**
   * Combines an array of Results into a single Result.
   * If all Results in the array are Ok, it returns an Ok with an array of all values.
   * If any Result in the array is an Err, it returns the first Err encountered.
   * @param results An array of Result<T, E> objects.
   * @returns A Result<T[], E>.
   */
  combine: <T, E>(results: Result<T, E>[]): Result<T[], E> => {
    const values: T[] = [];
    for (const result of results) {
      if (ResultUtils.isErr(result)) {
        return result;
      }
      values.push(result.unwrap());
    }
    return ResultUtils.ok(values);
  },
};