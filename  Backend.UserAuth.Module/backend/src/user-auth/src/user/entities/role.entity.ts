import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { UserEntity } from './user.entity';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // e.g., "Administrator", "MerchantOwner", "CampaignManager"

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, { eager: true, cascade: ['insert'] }) // eager: true to always load permissions with role
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: PermissionEntity[];

  @Column({ type: 'boolean', default: false })
  isSystemRole: boolean; // System roles cannot be deleted/modified by admin UI

  @ManyToMany(() => UserEntity, (user) => user.roles) // Inverse side of UserEntity.roles
  users: UserEntity[]; // Not usually loaded eagerly from role side

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}