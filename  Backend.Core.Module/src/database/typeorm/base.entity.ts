import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';
import { IAggregateRoot } from '../../common/interfaces/iaggregate-root.interface';

/**
 * @file Abstract base entity class for TypeORM.
 * @namespace AdManager.Platform.Backend.Core.Database.TypeOrm
 * @requirement REQ-16-009
 */

export abstract class BaseEntity extends TypeOrmBaseEntity implements IAggregateRoot {
  /**
   * Primary key, UUID.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Timestamp of entity creation.
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * Timestamp of last entity update.
   */
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * Version number for optimistic locking.
   * Incremented automatically on each update.
   */
  @VersionColumn()
  version: number;
}