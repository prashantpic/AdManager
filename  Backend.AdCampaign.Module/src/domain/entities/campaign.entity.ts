import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { CampaignObjective } from '../../constants/campaign-objective.enum';
import { CampaignStatus } from '../../constants/campaign-status.enum';
import { Budget } from './budget.entity';
import { Schedule } from './schedule.entity';
import { AdSet } from './ad-set.entity';
import { Audience } from './audience.entity';
import { CampaignSyncLog } from './campaign-sync-log.entity';
import { AdNetworkReference } from '../value-objects/ad-network-reference.vo';
import { AdNetworkType } from '../../constants/ad-network-type.enum';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ length: 255 })
  name: string; // Assumes CampaignName VO logic is handled in services/mappers

  @Column({
    type: 'enum',
    enum: CampaignObjective,
  })
  objective: CampaignObjective;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @OneToOne(() => Budget, (budget) => budget.campaign, {
    cascade: ['insert', 'update', 'remove'],
    eager: true, // Eager load for convenience, consider performance for lists
  })
  @JoinColumn()
  budget: Budget;

  @OneToOne(() => Schedule, (schedule) => schedule.campaign, {
    cascade: ['insert', 'update', 'remove'],
    eager: true, // Eager load
  })
  @JoinColumn()
  schedule: Schedule;

  @OneToMany(() => AdSet, (adSet) => adSet.campaign, {
    cascade: ['insert', 'update', 'remove'],
  })
  adSets: AdSet[];

  @ManyToOne(() => Audience, (audience) => audience.campaigns, {
    nullable: true,
    eager: true, // Eager load
  })
  @JoinColumn({ name: 'audienceId' })
  targetAudience?: Audience;

  @Column({ type: 'uuid', name: 'audienceId', nullable: true })
  audienceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  adNetworkReferences?: AdNetworkReference[]; // Array of AdNetworkReference VOs

  @OneToMany(() => CampaignSyncLog, (log) => log.campaign)
  syncLogs: CampaignSyncLog[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  archivedAt?: Date;

  // Domain logic methods
  changeStatus(newStatus: CampaignStatus): void {
    // Add validation for status transitions if needed
    this.status = newStatus;
    if (newStatus === CampaignStatus.ARCHIVED && !this.archivedAt) {
        this.archivedAt = new Date();
    } else if (newStatus !== CampaignStatus.ARCHIVED) {
        this.archivedAt = undefined; // or null
    }
  }

  updateDetails(data: {
    name?: string;
    objective?: CampaignObjective;
    audienceId?: string | null; // Allow unsetting audience
  }): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.objective !== undefined) this.objective = data.objective;
    if (data.audienceId !== undefined) this.audienceId = data.audienceId === null ? undefined : data.audienceId;

  }

  addAdSet(adSet: AdSet): void {
    if (!this.adSets) {
      this.adSets = [];
    }
    this.adSets.push(adSet);
  }

  addExternalReference(network: AdNetworkType, externalId: string): void {
    if (!this.adNetworkReferences) {
      this.adNetworkReferences = [];
    }
    // Remove existing reference for the same network if any, to avoid duplicates
    this.adNetworkReferences = this.adNetworkReferences.filter(ref => ref.adNetworkType !== network);
    this.adNetworkReferences.push(new AdNetworkReference(network, externalId));
  }

  logSync(log: CampaignSyncLog): void {
    if (!this.syncLogs) {
      this.syncLogs = [];
    }
    this.syncLogs.push(log);
  }

  archive(): void {
    this.changeStatus(CampaignStatus.ARCHIVED);
  }
}