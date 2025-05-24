import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// These interfaces will be defined in their respective files in a later iteration.
// For now, we declare them as types.
import { ShippingRuleConditionInterface } from '../interfaces/shipping-rule-condition.interface';
import { ShippingRuleActionInterface } from '../interfaces/shipping-rule-action.interface';

@Entity('shipping_rules')
export class ShippingRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // Index for efficient querying by merchantId
  merchantId: string;

  @Column()
  name: string;

  /**
   * Array of conditions that must all be met for this rule to apply.
   * Stored as JSONB in PostgreSQL.
   */
  @Column({ type: 'jsonb' })
  conditions: ShippingRuleConditionInterface[];

  /**
   * The action to take if all conditions are met.
   * Stored as JSONB in PostgreSQL.
   */
  @Column({ type: 'jsonb' })
  action: ShippingRuleActionInterface;

  @Column({ type: 'int', default: 0 })
  priority: number; // Lower number = higher priority

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}