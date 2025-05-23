/**
 * @file Implementation of the Maybe (Option) pattern for handling optional values.
 * @namespace AdManager.Platform.Backend.Core.Common.Patterns
 */

export class Some<T> {
  public readonly value: T;
  public readonly isSome = true;
  public readonly isNone = false;

  constructor(value: T) {
    if (value === null || value === undefined) {
      throw new Error('Cannot create Some with null or undefined value.');
    }
    this.value = value;
  }

  /**
   * Unwraps the value. Throws if called on None (type system prevents this).
   */
  public unwrap(): T {
    return this.value;
  }

  /**
   * Unwraps the value or returns a default if None.
   */
  public unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Maps a Some<T> to Some<U> by applying a function to the contained value.
   */
  public map<U>(fn: (value: T) => U): Some<U> {
    return new Some(fn(this.value));
  }

  /**
   * Calls the provided function with the contained value if Some, otherwise does nothing.
   * @param fn The function to call with the value.
   * @returns The original Some instance.
   */
  public ifSome(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Does nothing if Some.
   * @param _fn The function to call (not called for Some).
   * @returns The original Some instance.
   */
  public ifNone(_fn: () => void): this {
    // Do nothing for Some
    return this;
  }
}

export class None<T = unknown> {
  // Adding a phantom type T to make None<T> assignable to Maybe<T>
  // This value is never actually used.
  private _phantom?: T;
  public readonly isSome = false;
  public readonly isNone = true;

  constructor() {
    // No value to store
  }

  /**
   * Unwraps the value. Throws if called on None.
   */
  public unwrap(): T {
    throw new Error('Cannot unwrap None.');
  }

  /**
   * Unwraps the value or returns a default if None.
   */
  public unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Maps a None to None. The mapping function is not called.
   */
  public map<U>(_fn: (value: T) => U): None<U> {
    return new None<U>();
  }

  /**
   * Does nothing if None.
   * @param _fn The function to call (not called for None).
   * @returns The original None instance.
   */
  public ifSome(_fn: (value: T) => void): this {
    // Do nothing for None
    return this;
  }

  /**
   * Calls the provided function if None, otherwise does nothing.
   * @param fn The function to call.
   * @returns The original None instance.
   */
  public ifNone(fn: () => void): this {
    fn();
    return this;
  }
}

export type Maybe<T> = Some<T> | None<T>;

export const MaybeUtils = {
  some: <T>(value: T): Some<T> => new Some(value),
  none: <T = unknown>(): None<T> => new None<T>(),

  isSome: <T>(maybe: Maybe<T>): maybe is Some<T> => maybe.isSome,
  isNone: <T>(maybe: Maybe<T>): maybe is None<T> => maybe.isNone,

  /**
   * Creates a Maybe from a value that might be null or undefined.
   * @param value The value to convert.
   * @returns Some<T> if value is not null or undefined, otherwise None<T>.
   */
  fromNullable: <T>(value: T | null | undefined): Maybe<T> => {
    return value === null || value === undefined
      ? MaybeUtils.none<T>()
      : MaybeUtils.some(value);
  },
};