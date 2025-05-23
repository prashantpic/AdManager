import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdSet } from './ad-set.entity';
import { Creative } from './creative.entity';
import { AdCreativeContent } from '../value-objects/ad-creative-content.vo'; // For structure reference
import { CreativeType } from '../../constants/creative-type.enum';
import { AdNetworkReference } from '../value-objects/ad-network-reference.vo';
import { AdNetworkType } from '../../constants/ad-network-type.enum';

@Entity('ads')
export class Ad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => AdSet, (adSet) => adSet.ads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adSetId' })
  adSet: AdSet;

  @Column({ type: 'uuid' })
  adSetId: string;

  @ManyToOne(() => Creative, { nullable: true, eager: true }) // An ad must have a creative
  @JoinColumn({ name: 'creativeId' })
  creative?: Creative;

  @Column({ type: 'uuid', name: 'creativeId', nullable: true })
  creativeId?: string;
  
  @Column({
    type: 'enum',
    enum: CreativeType,
    nullable: true, // Can be derived from Creative entity or set if creative is defined inline
  })
  creativeType?: CreativeType;

  @Column({ type: 'jsonb', nullable: true })
  creativeContent?: AdCreativeContent; // Ad-specific overrides or content if not using a Creative entity

  @Column({ type: 'uuid', array: true, nullable: true })
  productIds?: string[];

  @Column({ type: 'uuid', array: true, nullable: true })
  promotionIds?: string[];

  @Column({ type: 'varchar', length: 2048, nullable: true }) // For landing page URL
  landingPageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  adNetworkReferences?: AdNetworkReference[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Domain logic methods
  associateCreative(creativeEntity: Creative): void {
    this.creative = creativeEntity;
    this.creativeId = creativeEntity.id;
    this.creativeType = creativeEntity.type; // Sync creative type
  }

  updateCreativeContent(content?: AdCreativeContent): void {
    this.creativeContent = content;
  }

  linkProducts(productIdsToLink?: string[]): void {
    this.productIds = productIdsToLink;
  }

  linkPromotions(promotionIdsToLink?: string[]): void {
    this.promotionIds = promotionIdsToLink;
  }

  updateLandingPage(url?: string): void {
    this.landingPageUrl = url;
  }

  addExternalReference(network: AdNetworkType, externalId: string): void {
    if (!this.adNetworkReferences) {
      this.adNetworkReferences = [];
    }
    this.adNetworkReferences = this.adNetworkReferences.filter(ref => ref.adNetworkType !== network);
    this.adNetworkReferences.push(new AdNetworkReference(network, externalId));
  }
}