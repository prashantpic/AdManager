import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';
import { IAggregateRoot } from '../../common/interfaces/iaggregate-root.interface';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @description Abstract base entity class for TypeORM.
 * Includes common fields like a UUID `id`, `createdAt`, `updatedAt` timestamps, and `version`.
 * Other entities in the application can extend this.
 * Implements IAggregateRoot as a marker.
 * REQ-16-009
 */
export abstract class BaseEntity extends TypeOrmBaseEntity implements IAggregateRoot {
  @ApiProperty({
    description: 'Unique identifier for the entity (UUID).',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Timestamp of when the entity was created.',
    example: '2023-01-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp of when the entity was last updated.',
    example: '2023-01-02T15:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Version number for optimistic concurrency control.',
    example: 1,
    type: Number,
  })
  @VersionColumn({ default: 1 })
  version: number;
}