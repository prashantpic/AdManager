import { IsString, IsArray, ValidateNested, IsNumber, IsBoolean, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingRuleConditionDto } from './shipping-rule-condition.dto'; // Assumed to exist
import { ShippingRuleActionDto } from './shipping-rule-action.dto'; // Assumed to exist
import { ShippingRuleConditionInterface } from '../interfaces/shipping-rule-condition.interface';
import { ShippingRuleActionInterface } from '../interfaces/shipping-rule-action.interface';

export class UpdateShippingRuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingRuleConditionDto)
  conditions?: ShippingRuleConditionInterface[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingRuleActionDto)
  action?: ShippingRuleActionInterface;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}