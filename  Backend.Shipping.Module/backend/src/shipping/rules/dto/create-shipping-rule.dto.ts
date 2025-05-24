import { IsString, IsArray, ValidateNested, IsNumber, IsBoolean, IsNotEmpty, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingRuleConditionDto } from './shipping-rule-condition.dto'; // Assumed to exist from previous step
import { ShippingRuleActionDto } from './shipping-rule-action.dto'; // Assumed to exist from previous step
import { ShippingRuleConditionInterface } from '../interfaces/shipping-rule-condition.interface';
import { ShippingRuleActionInterface } from '../interfaces/shipping-rule-action.interface';

export class CreateShippingRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingRuleConditionDto) // Use DTO for validation of nested array elements
  conditions: ShippingRuleConditionInterface[]; // Use interface for type hint in service/entity

  @ValidateNested()
  @Type(() => ShippingRuleActionDto) // Use DTO for validation of nested object
  action: ShippingRuleActionInterface; // Use interface for type hint in service/entity

  @IsNumber()
  @Min(0)
  priority: number;

  @IsBoolean()
  isActive: boolean;
}