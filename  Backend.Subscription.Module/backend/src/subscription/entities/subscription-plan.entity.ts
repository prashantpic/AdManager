import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PlanType } from '../common/enums/plan-type.enum';

@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  type: PlanType;

  @Column({ type: 'jsonb', name: 'pricing_tiers' })
  pricingTiersJson: string; // Stores PricingVO[] as JSON string

  @Column({ type: 'jsonb', name: 'features' })
  featuresJson: string; // Stores SubscriptionFeatureVO[] as JSON string

  @Column({ type: 'jsonb', name: 'usage_limits' })
  usageLimitsJson: string; // Stores UsageLimitVO[] as JSON string

  @Column({ name: 'support_level' })
  supportLevel: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}