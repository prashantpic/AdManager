import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Example: "users:create", "campaigns:read_all", "products:update_own"
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string; 

  @Column({ type: 'text', nullable: true })
  description: string;

  // Optional: For more structured permissions if 'name' isn't parsable enough
  @Column({ type: 'varchar', length: 100, nullable: true })
  resource?: string; // e.g., "users", "campaigns", "products"

  @Column({ type: 'varchar', length: 100, nullable: true })
  action?: string; // e.g., "create", "read", "update", "delete", "read_all", "update_own"

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[]; // Inverse side, not usually loaded eagerly from permission side

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}