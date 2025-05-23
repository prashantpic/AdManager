import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ISession } from 'express-session'; // For compatibility if needed


// This entity is based on TypeORM's `typeorm-store` or similar patterns.
// Adjust properties as needed for your session store implementation.
@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Index()
  @Column('bigint')
  expiredAt: number = Date.now(); // Stores as Unix timestamp (milliseconds)

  @Column('text')
  data: string; // JSON stringified session data

  // These columns are not standard for express-session's TypeORM store but useful for tracking
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // If you were to implement ISession for TypeORM store
  // json: any; // This would be the parsed 'data'
  // destroy(callback: (err?: any) => void): void;
  // reload(callback: (err?: any) => void): void;
  // save(callback: (err?: any) => void): void;
  // touch(callback: (err?: any) => void): void;
  // cookie: session.Cookie; // This is harder to map directly to TypeORM entity
}