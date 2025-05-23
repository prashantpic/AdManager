import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { AdSet } from './ad-set.entity';

export type BudgetType = 'DAILY' | 'LIFETIME';
export type BudgetAllocationStrategy = 'STANDARD' | 'ACCELERATED';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 19, scale: 4 }) // Example precision
  amount: number;

  @Column({ length: 3 }) // ISO 4217 currency code
  currency: string;

  @Column({
    type: 'enum',
    enum: ['DAILY', 'LIFETIME'],
  })
  type: BudgetType;

  @Column({
    type: 'enum',
    enum: ['STANDARD', 'ACCELERATED'],
    nullable: true,
  })
  allocationStrategy?: BudgetAllocationStrategy;

  @OneToOne(() => Campaign, (campaign) => campaign.budget, { nullable: true, onDelete: 'CASCADE' })
  campaign?: Campaign;

  @OneToOne(() => AdSet, (adSet) => adSet.budget, { nullable: true, onDelete: 'CASCADE' })
  adSet?: AdSet;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Method to update budget details
  updateDetails(details: {
    amount?: number;
    currency?: string;
    type?: BudgetType;
    allocationStrategy?: BudgetAllocationStrategy | null;
  }): void {
    if (details.amount !== undefined) this.amount = details.amount;
    if (details.currency !== undefined) this.currency = details.currency;
    if (details.type !== undefined) this.type = details.type;
    if (details.allocationStrategy !== undefined) {
        this.allocationStrategy = details.allocationStrategy === null ? undefined : details.allocationStrategy;
    }
  }
}