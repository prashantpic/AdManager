import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { AppEntity } from '../../app/entities/app.entity';
import { AppVersionEntity } from '../../app/entities/app-version.entity';
import { AppInstallationStatus } from '../../../common/enums/app-installation-status.enum';
import { InstallationConfig } from '../value-objects/installation-config.vo';
import { AppMerchantSubscriptionEntity } from '../../subscription/entities/app-merchant-subscription.entity';

@Entity('app_installations')
export class AppInstallationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AppEntity, (app) => app.installations, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'appId' })
  app: AppEntity;

  @Column({ type: 'uuid' })
  appId: string;

  @ManyToOne(() => AppVersionEntity, { onDelete: 'SET NULL', nullable: true, eager: false }) // If version is deleted, keep installation record
  @JoinColumn({ name: 'installedAppVersionId' })
  installedAppVersion: AppVersionEntity | null; // The specific version that is installed

  @Column({ type: 'uuid', nullable: true })
  installedAppVersionId: string | null;

  @Column({ type: 'uuid', comment: 'References merchant user ID' })
  merchantId: string;

  @Column({
    type: 'enum',
    enum: AppInstallationStatus,
    default: AppInstallationStatus.INSTALLING,
  })
  status: AppInstallationStatus;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  installationDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  uninstallationDate?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  configuration?: InstallationConfig | null; // Embed InstallationConfig VO

  @OneToOne(() => AppMerchantSubscriptionEntity, (subscription) => subscription.installation, { nullable: true })
  subscription?: AppMerchantSubscriptionEntity | null; // If this installation has an associated subscription

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}