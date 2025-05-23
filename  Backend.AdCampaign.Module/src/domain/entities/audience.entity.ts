import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TargetingParameters } from '../value-objects/targeting-parameters.vo';
import { Campaign } from './campaign.entity';

@Entity('audiences')
export class Audience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  targetingParameters: TargetingParameters; // Stored as JSONB

  @OneToMany(() => Campaign, campaign => campaign.targetAudience)
  campaigns: Campaign[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Domain logic methods
  updateParameters(params: TargetingParameters): void {
    this.targetingParameters = params;
  }

  updateDetails(data: { name?: string; description?: string | null, targetingParameters?: TargetingParameters }): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description === null ? undefined : data.description;
    if (data.targetingParameters !== undefined) this.targetingParameters = data.targetingParameters;
  }

  canBeEditedBy(requestingMerchantId: string): boolean {
    return this.merchantId === requestingMerchantId;
  }
}