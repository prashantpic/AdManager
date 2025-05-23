import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsNotEmptyObject } from 'class-validator';

// Minimal placeholder for AddressDto, assuming it's defined elsewhere (e.g., CoreModule).
// In a real scenario, this import would point to the actual file:
// import { AddressDto } from 'path/to/core/dtos/address.dto';
export class AddressDto {
  // Basic fields, expand as needed
  street1: string;
  city: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2 country code
  state?: string;
  name?: string;
  phone?: string;
  company?: string;
}

// Minimal placeholder for ParcelDto, assuming it's defined elsewhere (e.g., CoreModule).
// In a real scenario, this import would point to the actual file:
// import { ParcelDto } from 'path/to/core/dtos/parcel.dto';
export class ParcelDto {
  // Basic fields, expand as needed
  length: number;
  width: number;
  height: number;
  distance_unit: 'cm' | 'in'; // Example units
  weight: number;
  mass_unit: 'g' | 'kg' | 'oz' | 'lb'; // Example units
  quantity?: number;
}

/**
 * Platform-neutral Data Transfer Object for shipment details.
 * This DTO is used to provide information required for calculating shipping rates,
 * creating labels, or tracking shipments across different shipping providers.
 */
export class ShipmentDetailsDto {
  /**
   * The sender's address details.
   */
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => AddressDto)
  fromAddress: AddressDto;

  /**
   * The recipient's address details.
   */
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => AddressDto)
  toAddress: AddressDto;

  /**
   * An array of parcel details included in the shipment.
   * Each parcel can have its own dimensions and weight.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParcelDto)
  parcels: ParcelDto[];

  // Additional common fields can be added, such as:
  // shipmentDate?: Date;
  // options?: Record<string, any>; // e.g., { insurance: true, signature_required: true }
  // customsInfo?: any; // For international shipments
}