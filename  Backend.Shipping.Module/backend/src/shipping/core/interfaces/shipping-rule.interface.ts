// These interfaces will be defined in their respective files in a later iteration.
// For now, we declare them as types for `IShippingRule`.
import { ShippingRuleConditionInterface } from '../../rules/interfaces/shipping-rule-condition.interface';
import { ShippingRuleActionInterface } from '../../rules/interfaces/shipping-rule-action.interface';

/**
 * Defines the data structure for shipping rules used within the domain/application services.
 * This interface represents the conceptual model of a shipping rule.
 */
export interface IShippingRule {
  id: string;
  merchantId: string;
  name: string;
  conditions: ShippingRuleConditionInterface[];
  action: ShippingRuleActionInterface;
  priority: number; // Lower number means higher priority
  isActive: boolean;
  createdAt?: Date; // Optional, as it might not be present in all contexts (e.g., before creation)
  updatedAt?: Date; // Optional
}