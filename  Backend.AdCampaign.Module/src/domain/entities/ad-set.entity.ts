import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Ad } from './ad.entity';
import { Audience } from './audience.entity';
import { Budget } from './budget.entity';
import { Schedule } from './schedule.entity';
import { BidStrategy } from '../value-objects/bid-strategy.vo'; // For structure reference
import { TargetingParameters } from '../value-objects/targeting-parameters.vo'; // For structure reference
import { AdNetworkReference } from '../value-objects/ad-network-reference.vo';
import { AdNetworkType } from '../../constants/ad-network-type.enum';

@Entity('ad_sets')
export class AdSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.adSets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ type: 'uuid' })
  campaignId: string;

  @OneToOne(() => Budget, (budget) => budget.adSet, {
    cascade: ['insert', 'update', 'remove'],
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  budget?: Budget;

  @OneToOne(() => Schedule, (schedule) => schedule.adSet, {
    cascade: ['insert', 'update', 'remove'],
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  schedule?: Schedule;

  // Targeting can be a specific audience or inline parameters
  @ManyToOne(() => Audience, { nullable: true, eager: true })
  @JoinColumn({ name: 'targetAudienceId' })
  targetAudience?: Audience;
  
  @Column({ type: 'uuid', name: 'targetAudienceId', nullable: true })
  audienceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  targetingParameters?: TargetingParameters; // Inline targeting parameters if no Audience entity is linked

  @Column({ type: 'jsonb', nullable: true })
  bidStrategy?: BidStrategy;

  @OneToMany(() => Ad, (ad) => ad.adSet, {
    cascade: ['insert', 'update', 'remove'],
  })
  ads: Ad[];

  @Column({ type: 'jsonb', nullable: true })
  adNetworkReferences?: AdNetworkReference[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Domain logic methods
  addAd(ad: Ad): void {
    if (!this.ads) {
      this.ads = [];
    }
    this.ads.push(ad);
  }

  updateDetails(data: {
    name?: string;
    audienceId?: string | null;
    targetingParameters?: TargetingParameters | null;
    bidStrategy?: BidStrategy | null;
  }): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.audienceId !== undefined) this.audienceId = data.audienceId === null ? undefined : data.audienceId;
    if (data.targetingParameters !== undefined) this.targetingParameters = data.targetingParameters === null ? undefined : data.targetingParameters;
    if (data.bidStrategy !== undefined) this.bidStrategy = data.bidStrategy === null ? undefined : data.bidStrategy;
  }

  addExternalReference(network: AdNetworkType, externalId: string): void {
    if (!this.adNetworkReferences) {
      this.adNetworkReferences = [];
    }
    this.adNetworkReferences = this.adNetworkReferences.filter(ref => ref.adNetworkType !== network);
    this.adNetworkReferences.push(new AdNetworkReference(network, externalId));
  }
}