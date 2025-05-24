import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { AddressModel } from '../../core/models/address.model';
import { ParcelModel } from '../../core/models/parcel.model';
import { ShipmentLineItemModel } from '../../core/models/shipment-line-item.model';

// Generic structure interfaces (can be defined elsewhere if shared)
interface GenericAddressStructure {
  streetLines: string[];
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
  companyName?: string;
  contactName?: string;
  phoneNumber?: string;
  isResidential?: boolean;
}

interface GenericParcelStructure {
  weight: number;
  weightUnit: string;
  length: number;
  width: number;
  height: number;
  dimensionUnit: string;
  description?: string;
  value?: number;
  currency?: string;
}

interface GenericLineItemStructure {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  weight?: number;
  weightUnit?: string;
  productType?: string; // Use string representation of enum
  requiresSpecialHandling?: boolean;
}

interface GenericShipmentStructure {
  originAddress: GenericAddressStructure;
  destinationAddress: GenericAddressStructure;
  parcels: GenericParcelStructure[];
  lineItems: GenericLineItemStructure[];
  totalOrderValue: number;
  currency: string;
  shipmentDate?: Date;
}


export class ShipmentDetailsMapper {
  static toGenericAddress(address: AddressModel): GenericAddressStructure {
    return {
      streetLines: [address.street1, address.street2].filter(Boolean) as string[],
      city: address.city,
      stateProvince: address.stateProvince,
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      companyName: address.companyName,
      contactName: address.contactName,
      phoneNumber: address.phoneNumber,
      isResidential: address.isResidential,
    };
  }

  static toGenericParcel(parcel: ParcelModel): GenericParcelStructure {
    return {
      weight: parcel.weight,
      weightUnit: parcel.weightUnit,
      length: parcel.length,
      width: parcel.width,
      height: parcel.height,
      dimensionUnit: parcel.dimensionUnit,
      description: parcel.description,
      value: parcel.value,
      currency: parcel.currency,
    };
  }

  static toGenericLineItem(item: ShipmentLineItemModel): GenericLineItemStructure {
    return {
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      weight: item.weight,
      weightUnit: item.weightUnit,
      productType: item.productType?.toString(), // Convert enum to string
      requiresSpecialHandling: item.requiresSpecialHandling,
    };
  }

  /**
   * Converts ShipmentDetailsModel to a generic structure.
   * This can be a common intermediate step before provider-specific mapping.
   */
  static toGenericShipmentStructure(details: ShipmentDetailsModel): GenericShipmentStructure {
    return {
      originAddress: this.toGenericAddress(details.originAddress),
      destinationAddress: this.toGenericAddress(details.destinationAddress),
      parcels: details.parcels.map(this.toGenericParcel),
      lineItems: details.lineItems.map(this.toGenericLineItem),
      totalOrderValue: details.totalOrderValue,
      currency: details.currency,
      shipmentDate: details.shipmentDate,
    };
  }
}