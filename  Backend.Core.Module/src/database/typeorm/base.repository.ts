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
import { BaseEntity } from './base.entity'; // Assuming BaseEntity will be created

/**
 * @class BaseRepository
 * @template T - A TypeORM entity that extends BaseEntity.
 * @description Generic base repository class for TypeORM entities, providing common CRUD operations
 * and potentially other shared query logic.
 * REQ-11-008, REQ-14-004
 */
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Creates a new entity instance. Does not save it.
   * @param entityLike - The data for the new entity.
   * @returns The created entity instance.
   */
  create(entityLike: DeepPartial<T>): T {
    return this.repository.create(entityLike);
  }

  /**
   * Saves a given entity or array of entities. If the entity already exist in the database, it is updated.
   * If the entity does not exist in the database, it is inserted.
   * @param entity - The entity or array of entities to save.
   * @returns The saved entity or array of entities.
   */
  async save(entity: DeepPartial<T>): Promise<T>;
  async save(entities: DeepPartial<T>[]): Promise<T[]>;
  async save(entityOrEntities: DeepPartial<T> | DeepPartial<T>[]): Promise<T | T[]> {
    // TypeORM's save method handles both single entity and array of entities.
    // However, to satisfy TypeScript's overload resolution, we might need to cast.
    if (Array.isArray(entityOrEntities)) {
        return this.repository.save(entityOrEntities as DeepPartial<T>[]);
    }
    return this.repository.save(entityOrEntities as DeepPartial<T>);
  }


  /**
   * Finds first entity by a given find options. If entity was not found in the database - undefined is returned.
   * @param options - Find options.
   * @returns The found entity or undefined.
   */
  async findOne(options: FindOneOptions<T>): Promise<T | undefined> {
    const result = await this.repository.findOne(options);
    return result === null ? undefined : result;
  }

  /**
   * Finds entity by its ID. If entity was not found in the database - undefined is returned.
   * @param id - The ID of the entity.
   * @param options - Additional find options.
   * @returns The found entity or undefined.
   */
  async findOneById(id: string, options?: Omit<FindOneOptions<T>, 'where'>): Promise<T | undefined> {
    // TypeORM's `findOneBy` is simpler for ID lookups.
    // Constructing FindOneOptions for findOne to include relations etc.
    const findOptions: FindOneOptions<T> = {
        ...options,
        where: { id } as FindOptionsWhere<T>, // Cast to FindOptionsWhere<T>
    };
    const result = await this.repository.findOne(findOptions);
    return result === null ? undefined : result;
  }

  /**
   * Finds all entities that match given find options.
   * @param options - Find options.
   * @returns An array of found entities.
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Updates entity by a given criteria or entity ID.
   * @param criteria - The criteria to update by (e.g., ID or other conditions).
   * @param partialEntity - The fields to update.
   * @returns UpdateResult object.
   */
  async update(
    criteria: string | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    return this.repository.update(criteria as any, partialEntity); // 'any' for criteria due to string | FindOptionsWhere<T>
  }

  /**
   * Deletes entities by a given criteria or entity ID.
   * @param criteria - The criteria to delete by (e.g., ID or other conditions).
   * @returns DeleteResult object.
   */
  async delete(criteria: string | FindOptionsWhere<T>): Promise<DeleteResult> {
    return this.repository.delete(criteria as any); // 'any' for criteria due to string | FindOptionsWhere<T>
  }

  /**
   * Counts entities that match given find options.
   * @param options - Find options.
   * @returns The number of matching entities.
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  /**
   * Checks if entity with given find options exist.
   * @param options - Find options.
   * @returns True if entity exists, false otherwise.
   */
  async exists(options: FindManyOptions<T>): Promise<boolean> {
    return this.repository.exists(options);
  }
}
```