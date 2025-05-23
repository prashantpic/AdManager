```typescript
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  Repository,
  UpdateResult,
  DeleteResult,
  FindOptionsWhere,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
// TODO: Import BaseEntity once defined in ./base.entity.ts
// For now, using a placeholder.
interface BaseEntity {
  id: string | number; // Assuming id is string (UUID) or number
  createdAt: Date;
  updatedAt: Date;
  // version?: number;
}

/**
 * Abstract base repository for TypeORM entities.
 * Provides common CRUD operations.
 * @template TEntity - The TypeORM entity type, extending BaseEntity.
 */
export abstract class BaseRepository<TEntity extends BaseEntity> {
  constructor(protected readonly repository: Repository<TEntity>) {}

  /**
   * Creates a new entity instance.
   * @param data - The data for the new entity.
   * @returns The new entity instance.
   */
  create(data: DeepPartial<TEntity>): TEntity {
    return this.repository.create(data);
  }

  /**
   * Saves an entity (inserts or updates).
   * @param entity - The entity to save.
   * @returns The saved entity.
   */
  async save(entity: TEntity): Promise<TEntity> {
    return this.repository.save(entity);
  }

  /**
   * Saves multiple entities.
   * @param entities - An array of entities to save.
   * @returns The saved entities.
   */
  async saveMany(entities: TEntity[]): Promise<TEntity[]> {
    return this.repository.save(entities);
  }

  /**
   * Finds an entity by its ID.
   * @param id - The ID of the entity.
   * @param options - Optional find options.
   * @returns The found entity or null if not found.
   */
  async findOneById(id: string | number, options?: FindOneOptions<TEntity>): Promise<TEntity | null> {
    const where = { id } as FindOptionsWhere<TEntity>;
    return this.repository.findOne({ where, ...options });
  }

   /**
   * Finds the first entity that matches some id or find options.
   * @param options - Find options.
   * @returns The found entity or null if not found.
   */
  async findOne(options: FindOneOptions<TEntity>): Promise<TEntity | null> {
    return this.repository.findOne(options);
  }

  /**
   * Finds all entities matching the given options.
   * @param options - Optional find options.
   * @returns An array of found entities.
   */
  async findAll(options?: FindManyOptions<TEntity>): Promise<TEntity[]> {
    return this.repository.find(options);
  }

  /**
   * Updates an entity by its ID.
   * @param id - The ID of the entity to update.
   * @param updateData - The data to update.
   * @returns The result of the update operation.
   */
  async update(
    id: string | number,
    updateData: QueryDeepPartialEntity<TEntity>,
  ): Promise<UpdateResult> {
    return this.repository.update(id, updateData);
  }

  /**
   * Deletes an entity by its ID.
   * @param id - The ID of the entity to delete.
   * @returns The result of the delete operation.
   */
  async delete(id: string | number): Promise<DeleteResult> {
    return this.repository.delete(id);
  }

  /**
   * Counts entities that match find options.
   * @param options - Optional find options.
   * @returns The number of entities.
   */
  async count(options?: FindManyOptions<TEntity>): Promise<number> {
    return this.repository.count(options);
  }
}
```