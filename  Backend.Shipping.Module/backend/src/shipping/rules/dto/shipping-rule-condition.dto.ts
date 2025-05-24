import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ShippingRuleConditionType } from '../../core/enums/shipping-rule-condition-type.enum';
import { ConditionOperator } from '../interfaces/shipping-rule-condition.interface';
import { ShippingProductType } from '../../core/enums/product-type.enum';

export class ShippingRuleConditionDto {
  @IsEnum(ShippingRuleConditionType)
  type: ShippingRuleConditionType;

  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  // Single value used with EQ, NE, GT, LT, GTE, LTE, STARTS_WITH, ENDS_WITH operators
  @ValidateIf(c => ![ConditionOperator.BETWEEN, ConditionOperator.IN, ConditionOperator.NOT_IN].includes(c.operator))
  @IsOptional()
  value?: string | number | boolean | ShippingProductType;

  // Used with BETWEEN operator
  @ValidateIf(c => c.operator === ConditionOperator.BETWEEN)
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ValidateIf(c => c.operator === ConditionOperator.BETWEEN)
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  // Used with IN, NOT_IN operators
  @ValidateIf(c => [ConditionOperator.IN, ConditionOperator.NOT_IN].includes(c.operator))
  @IsArray()
  @IsOptional() // Array can be empty but should be an array
  values?: (string | number | ShippingProductType)[];

  // Optional units/currency for specific condition types
  @ValidateIf(c => c.type === ShippingRuleConditionType.WEIGHT)
  @IsOptional()
  @IsString()
  weightUnit?: string; // e.g., 'KG', 'LB'

  @ValidateIf(c => c.type === ShippingRuleConditionType.DIMENSIONS)
  @IsOptional()
  @IsString()
  dimensionUnit?: string; // e.g., 'CM', 'IN'

  @ValidateIf(c => c.type === ShippingRuleConditionType.ORDER_VALUE)
  @IsOptional()
  @IsString()
  currency?: string; // e.g., 'USD', 'SAR'
}