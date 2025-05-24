import { ShippingRuleConditionType } from '../../core/enums/shipping-rule-condition-type.enum';
import { ShippingProductType } from '../../core/enums/product-type.enum';

export enum ConditionOperator {
  EQ = 'EQ', // Equals
  NE = 'NE', // Not Equals
  GT = 'GT', // Greater Than
  LT = 'LT', // Less Than
  GTE = 'GTE', // Greater Than or Equal
  LTE = 'LTE', // Less Than or Equal
  BETWEEN = 'BETWEEN', // Inclusive range (minValue, maxValue)
  IN = 'IN', // Value is within a list of 'values'
  NOT_IN = 'NOT_IN', // Value is not within a list of 'values'
  STARTS_WITH = 'STARTS_WITH', // For strings like postal codes
  ENDS_WITH = 'ENDS_WITH', // For strings like postal codes
  CONTAINS = 'CONTAINS', // For arrays like product types
  NOT_CONTAINS = 'NOT_CONTAINS', // For arrays like product types
}

export interface ShippingRuleConditionInterface {
  type: ShippingRuleConditionType;
  operator: ConditionOperator;
  value?: string | number | boolean | ShippingProductType; // For EQ, NE, GT, LT, GTE, LTE, STARTS_WITH, ENDS_WITH
  minValue?: number; // For BETWEEN
  maxValue?: number; // For BETWEEN
  values?: (string | number | ShippingProductType)[]; // For IN, NOT_IN, CONTAINS, NOT_CONTAINS
  unit?: string; // e.g., 'KG', 'CM', 'USD' - context for value/minValue/maxValue
}