/**
 * @interface IDomainEvent
 * @description Base interface for Domain Events in Domain-Driven Design.
 * Domain events represent something significant that has happened in the domain.
 */
export interface IDomainEvent<T = any> {
  /**
   * The unique identifier for this specific event instance.
   */
  readonly eventId: string;

  /**
   * The timestamp when the event occurred.
   */
  readonly timestamp: Date;

  /**
   * The type or name of the event (e.g., 'UserCreatedEvent', 'OrderPlacedEvent').
   */
  readonly type: string;

  /**
   * The version of the event schema, useful for event versioning.
   */
  readonly eventVersion: number;

  /**
   * The ID of the aggregate root that this event pertains to.
   * Optional, as some events might not be directly tied to a single aggregate.
   */
  readonly aggregateId?: string;

  /**
   * The type of the aggregate root (e.g., 'User', 'Order').
   * Optional.
   */
  readonly aggregateType?: string;

  /**
   * The payload of the event, containing the data specific to this event.
   */
  readonly payload: T;

  /**
   * Optional metadata associated with the event, such as correlation ID, user ID, tenant ID.
   */
  readonly metadata?: Record<string, any>;
}