/**
 * @file Base interface for Domain Events in DDD.
 * @namespace AdManager.Platform.Backend.Core.Common.Interfaces
 */

export interface IDomainEvent<T = any> {
  /**
   * Unique identifier for the event instance.
   */
  readonly eventId: string;

  /**
   * Timestamp when the event occurred.
   */
  readonly timestamp: Date;

  /**
   * The type or name of the event.
   * @example "UserRegisteredEvent"
   */
  readonly type: string;

  /**
   * Identifier of the aggregate root that this event pertains to, if applicable.
   */
  readonly aggregateId?: string;

  /**
   * Version of the aggregate root after this event was applied.
   * Useful for event sourcing or optimistic concurrency.
   */
  readonly aggregateVersion?: number;

  /**
   * The payload or data associated with the event.
   */
  readonly payload: T;

  /**
   * Metadata associated with the event, such as correlation ID, user ID, etc.
   */
  readonly metadata?: Record<string, any>;
}