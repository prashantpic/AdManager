import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Tree,
  TreeChildren,
  TreeParent,
  Index,
} from 'typeorm';
import { AppEntity } from '../../app/entities/app.entity';

@Entity('app_categories')
@Tree('materialized-path') // or 'closure-table' or 'nested-set'
@Index(['slug'], { unique: true })
@Index(['name'], { unique: true })
export class AppCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => AppEntity, (app) => app.category)
  apps: AppEntity[];

  @TreeChildren()
  childCategories: AppCategoryEntity[];

  @TreeParent({ onDelete: 'SET NULL' }) // If parent is deleted, children become top-level or handle differently
  @JoinColumn({ name: 'parentCategoryId' })
  parentCategory?: AppCategoryEntity | null;

  @Column({ type: 'uuid', nullable: true })
  parentCategoryId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}