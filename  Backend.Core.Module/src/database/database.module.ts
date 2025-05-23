```typescript
import { Module } from '@nestjs/common';
import { CoreTypeOrmModule } from './typeorm/typeorm.module';
import { CoreDynamoDBModule } from './dynamodb/dynamodb.module';

/**
 * @class DatabaseModule
 * @description Main NestJS module for database functionalities.
 * It imports and configures specific database modules like `CoreTypeOrmModule` (for PostgreSQL)
 * and `CoreDynamoDBModule`.
 * REQ-11-008, REQ-11-009
 */
@Module({
  imports: [CoreTypeOrmModule, CoreDynamoDBModule],
  exports: [CoreTypeOrmModule, CoreDynamoDBModule],
})
export class DatabaseModule {}
```