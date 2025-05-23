import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { AdSet } from './ad-set.entity';
import { Ad } from './ad.entity';
import { AdNetworkType } from '../../constants/ad-network-type.enum';

export type SyncEntityType = 'CAMPAIGN' | 'AD_SET' | 'AD';
export type SyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';

@Entity('campaign_sync_logs')
export class CampaignSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.syncLogs, {
    onDelete: 'CASCADE',
    nullable: false, // A log must be tied to a campaign
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ type: 'uuid' })
  campaignId: string;


  @ManyToOne(() => AdSet, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adSetId' })
  adSet?: AdSet;

  @Column({ type: 'uuid', nullable: true })
  adSetId?: string;


  @ManyToOne(() => Ad, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adId' })
  ad?: Ad;

  @Column({ type: 'uuid', nullable: true })
  adId?: string;

  @Column({
    type: 'enum',
    enum: ['CAMPAIGN', 'AD_SET', 'AD'],
  })
  entityType: SyncEntityType;

  @Column({ type: 'uuid' }) // ID of the entity being synced (Campaign, AdSet, or Ad)
  entityId: string;

  @Column({
    type: 'enum',
    enum: AdNetworkType,
  })
  adNetworkType: AdNetworkType;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  syncAttemptTime: Date;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'IN_PROGRESS'],
    default: 'PENDING',
  })
  status: SyncStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'text', nullable: true }) // External ID from the ad network
  externalId?: string;

  @Column({ type: 'jsonb', nullable: true })
  requestPayload?: any; // Store sanitized request payload for debugging

  @Column({ type: 'jsonb', nullable: true })
  responseDetails?: any; // Store sanitized response details

  @Column({ type: 'text', nullable: true })
  syncAction?: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'
}