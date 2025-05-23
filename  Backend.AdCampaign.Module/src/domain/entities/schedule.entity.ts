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

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate?: Date;

  @Column({ length: 100, nullable: true }) // IANA Time Zone Database name e.g., "America/New_York"
  timeZone?: string;

  @OneToOne(() => Campaign, (campaign) => campaign.schedule, { nullable: true, onDelete: 'CASCADE' })
  campaign?: Campaign;

  @OneToOne(() => AdSet, (adSet) => adSet.schedule, { nullable: true, onDelete: 'CASCADE' })
  adSet?: AdSet;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Method to update schedule details
  updateDetails(details: {
    startDate?: Date;
    endDate?: Date | null; // Allow unsetting endDate
    timeZone?: string | null; // Allow unsetting timeZone
  }): void {
    if (details.startDate !== undefined) this.startDate = details.startDate;
    if (details.endDate !== undefined) this.endDate = details.endDate === null ? undefined : details.endDate;
    if (details.timeZone !== undefined) this.timeZone = details.timeZone === null ? undefined : details.timeZone;
  }
}