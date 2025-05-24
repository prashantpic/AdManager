import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { AppEntity } from './app.entity';

@Entity('app_permissions')
export class AppPermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  permissionName: string; // e.g., 'READ_PRODUCTS', 'WRITE_ORDERS'

  @Column('text')
  description: string;

  @ManyToMany(() => AppEntity, (app) => app.requiredPermissions)
  apps: AppEntity[]; // Apps that require this permission

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}