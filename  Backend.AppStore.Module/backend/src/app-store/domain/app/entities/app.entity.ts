import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AppStatus } from '../../../common/enums/app-status.enum';
import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';
import { AppVersionEntity } from './app-version.entity';
import { AppAssetEntity } from './app-asset.entity';
import { AppMetadataEntity } from './app-metadata.entity';
import { AppPermissionEntity } from './app-permission.entity';
import { AppCategoryEntity } from '../../category/entities/app-category.entity';
import { AppRatingReviewEntity } from '../../rating-review/entities/app-rating-review.entity';
import { AppInstallationEntity } from '../../installation/entities/app-installation.entity';
import { AppMerchantSubscriptionEntity } from '../../subscription/entities/app-merchant-subscription.entity';
import { DeveloperInfo } from '../value-objects/developer-info.vo';
import { AppPricing } from '../value-objects/app-pricing.vo';

@Entity('apps')
export class AppEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'uuid', comment: 'References developer user ID from an external UserAuth module' })
  developerId: string;

  @Column({
    type: 'enum',
    enum: AppStatus,
    default: AppStatus.DRAFT,
  })
  status: AppStatus;

  @ManyToOne(() => AppCategoryEntity, (category) => category.apps, {
    nullable: true, // An app might not have a category initially or support uncategorized
    eager: true, // Often needed when displaying app info
  })
  @JoinColumn({ name: 'categoryId' })
  category?: AppCategoryEntity;

  @Column({ type: 'uuid', name: 'categoryId', nullable: true })
  categoryId?: string;

  @Column({
    type: 'enum',
    enum: AppPricingModel,
  })
  pricingModel: AppPricingModel;

  @Column({ type: 'jsonb' })
  pricingDetails: AppPricing; // Embed AppPricing VO

  @Column({ type: 'jsonb' })
  developerInfo: DeveloperInfo; // Embed DeveloperInfo VO

  @OneToMany(() => AppVersionEntity, (version) => version.app, { cascade: true })
  versions: AppVersionEntity[];

  @OneToMany(() => AppAssetEntity, (asset) => asset.app, { cascade: true })
  assets: AppAssetEntity[];

  @OneToMany(() => AppMetadataEntity, (metadata) => metadata.app, { cascade: true })
  metadata: AppMetadataEntity[];

  @ManyToMany(() => AppPermissionEntity, (permission) => permission.apps, { cascade: ['insert', 'update'] })
  @JoinTable({
    name: 'app_required_permissions',
    joinColumn: { name: 'appId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  requiredPermissions: AppPermissionEntity[];

  @OneToMany(() => AppRatingReviewEntity, (ratingReview) => ratingReview.app)
  ratingsAndReviews: AppRatingReviewEntity[];

  @OneToMany(() => AppInstallationEntity, (installation) => installation.app)
  installations: AppInstallationEntity[];

  @OneToMany(() => AppMerchantSubscriptionEntity, (subscription) => subscription.app)
  merchantSubscriptions: AppMerchantSubscriptionEntity[];
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Example business logic methods
  publish(): void {
    if (this.status === AppStatus.APPROVED || this.status === AppStatus.UNPUBLISHED) {
      this.status = AppStatus.PUBLISHED;
    } else {
      throw new Error(`App in status ${this.status} cannot be published directly.`);
    }
  }

  unpublish(): void {
    if (this.status === AppStatus.PUBLISHED) {
      this.status = AppStatus.UNPUBLISHED;
    } else {
      throw new Error(`App in status ${this.status} cannot be unpublished.`);
    }
  }

  reject(): void {
    this.status = AppStatus.REJECTED;
  }

  approve(): void {
     // Approval might lead to PENDING_PUBLICATION or directly to PUBLISHED depending on workflow
    this.status = AppStatus.APPROVED;
  }
}