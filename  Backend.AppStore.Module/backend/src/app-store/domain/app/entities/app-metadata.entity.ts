import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppEntity } from './app.entity';

@Entity('app_metadata')
export class AppMetadataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AppEntity, (app) => app.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: AppEntity;

  @Column({ type: 'uuid' })
  appId: string;

  @Column({ length: 255 })
  key: string;

  @Column({ type: 'jsonb' })
  value: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}