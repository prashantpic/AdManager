import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ShippingProductType } from '../enums/product-type.enum';
import { DEFAULT_WEIGHT_UNIT } from '../../common/constants/shipping.constants';

export class ShipmentLineItemModel {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number; // Price per single item

  @IsOptional()
  @IsNumber()
  weight?: number; // Weight per single item

  @IsOptional()
  @IsString()
  weightUnit?: string = DEFAULT_WEIGHT_UNIT; // e.g., KG, LB

  @IsOptional()
  @IsEnum(ShippingProductType)
  productType?: ShippingProductType = ShippingProductType.GENERAL;

  @IsOptional()
  @IsBoolean()
  requiresSpecialHandling?: boolean;

  // Value of the line item (quantity * unitPrice) can be calculated
  get lineItemValue(): number {
    return this.quantity * this.unitPrice;
  }
}