/**
 * @description Base interface for Domain Events in Domain-Driven Design.
 * Domain events represent something significant that has happened in the domain.
 */
export interface IDomainEvent<T = any> {
  /**
   * Unique identifier for the event instance.
   */
  readonly eventId: string; // Typically a UUID

  /**
   * Name of the event.
   * e.g., 'UserRegisteredEvent', 'OrderPlacedEvent'
   */
  readonly eventName: string;

  /**
   * Timestamp when the event occurred.
   */
  readonly timestamp: Date;

  /**
   * Identifier of the aggregate root that this event pertains to, if applicable.
   */
  readonly aggregateId?: string; // Typically a UUID

  /**
   * Version of the aggregate root after this event was applied, if applicable.
   * Useful for optimistic concurrency control or event sourcing.
   */
  readonly aggregateVersion?: number;

  /**
   * The payload of the event, containing relevant data.
   */
  readonly payload: T;

  /**
   * Metadata associated with the event, e.g., correlation ID, user ID.
   */
  readonly metadata?: Record<string, any>;
}