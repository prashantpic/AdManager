import { IsString, ValidateNested, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model'; // Assuming this model exists

/**
 * Internal DTO to request shipping rates from the ShippingService.
 * This is NOT typically exposed directly via an API controller without transformation.
 */
export class RateRequestDto {
  @IsString()
  merchantId: string;

  @ValidateNested()
  @Type(() => ShipmentDetailsModel)
  shipmentDetails: ShipmentDetailsModel;

  /**
   * Optional parameters that might influence rate calculation or provider selection.
   * Example: preferred_carrier_ids, requested_service_levels, insurance_options.
   * Structure can be flexible.
   */
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}