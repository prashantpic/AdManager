import { IsString, IsArray, ValidateNested, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingRuleConditionDto } from './shipping-rule-condition.dto'; // Assumed to exist
import { ShippingRuleActionDto } from './shipping-rule-action.dto'; // Assumed to exist

export class ShippingRuleDto {
  @IsString()
  id: string;

  @IsString()
  merchantId: string;

  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingRuleConditionDto)
  conditions: ShippingRuleConditionDto[]; // Use DTOs for API response consistency

  @ValidateNested()
  @Type(() => ShippingRuleActionDto)
  action: ShippingRuleActionDto; // Use DTOs for API response consistency

  @IsNumber()
  priority: number;

  @IsBoolean()
  isActive: boolean;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}