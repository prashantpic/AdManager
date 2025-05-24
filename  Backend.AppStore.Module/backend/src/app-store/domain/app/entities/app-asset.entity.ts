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

export enum AppAssetType {
  ICON = 'ICON',
  SCREENSHOT = 'SCREENSHOT',
  VIDEO_PREVIEW = 'VIDEO_PREVIEW',
  FEATURE_GRAPHIC = 'FEATURE_GRAPHIC',
  DOCUMENTATION = 'DOCUMENTATION',
}

@Entity('app_assets')
export class AppAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AppEntity, (app) => app.assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: AppEntity;

  @Column({ type: 'uuid' })
  appId: string;

  @Column({
    type: 'enum',
    enum: AppAssetType,
  })
  assetType: AppAssetType;

  @Column({ type: 'varchar', length: 2048 }) // URL to the asset (e.g., S3 link)
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  @Column({ type: 'int', nullable: true })
  displayOrder: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}