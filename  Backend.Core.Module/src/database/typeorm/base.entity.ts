import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IAggregateRoot } from '../../common/interfaces/iaggregate-root.interface';

/**
 * @class BaseEntity
 * @description Abstract base entity class for TypeORM.
 * Includes common fields like a UUID `id`, `createdAt`, `updatedAt` timestamps, and `version`.
 * Implements IAggregateRoot for DDD purposes.
 * @Requirement REQ-16-009
 */
export abstract class BaseEntity extends TypeOrmBaseEntity implements IAggregateRoot {
  @ApiProperty({
    description: 'Unique identifier for the entity (UUID).',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    readOnly: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Timestamp of when the entity was created.',
    example: '2023-01-01T12:00:00.000Z',
    type: Date,
    readOnly: true,
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp of when the entity was last updated.',
    example: '2023-01-01T13:00:00.000Z',
    type: Date,
    readOnly: true,
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Version number for optimistic locking.',
    example: 1,
    type: Number,
    readOnly: true,
  })
  @VersionColumn()
  version: number;
}