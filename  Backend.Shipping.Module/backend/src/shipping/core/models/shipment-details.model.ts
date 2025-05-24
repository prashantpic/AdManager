import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressModel } from './address.model';
import { ParcelModel } from './parcel.model';
import { ShipmentLineItemModel } from './shipment-line-item.model';
import { ShippingProductType } from '../enums/product-type.enum';

export class ShipmentDetailsModel {
  @ValidateNested()
  @Type(() => AddressModel)
  originAddress: AddressModel;

  @ValidateNested()
  @Type(() => AddressModel)
  destinationAddress: AddressModel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParcelModel)
  parcels: ParcelModel[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentLineItemModel)
  lineItems: ShipmentLineItemModel[];

  @IsNumber()
  @Min(0)
  totalOrderValue: number;

  @IsString()
  @MaxLength(3)
  currency: string; // Currency of totalOrderValue and lineItem unitPrice

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  shipmentDate?: Date; // Requested ship date

  get totalWeight(): number {
    return this.parcels.reduce((sum, parcel) => {
      // Basic sum, assumes consistent units or pre-conversion
      return sum + (parcel.weight || 0);
    }, 0);
  }

  get totalVolume(): number {
    return this.parcels.reduce((sum, p) => {
      // Basic sum, assumes consistent units or pre-conversion
      return sum + ((p.length || 0) * (p.width || 0) * (p.height || 0));
    }, 0);
  }

  get uniqueProductTypes(): ShippingProductType[] {
    const types = this.lineItems
      .map(item => item.productType)
      .filter(type => type !== undefined) as ShippingProductType[];
    return Array.from(new Set(types));
  }

  get totalQuantity(): number {
    return this.lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }
}