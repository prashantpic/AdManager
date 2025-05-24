import { IsString, ValidateNested, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model'; // Assuming this model exists

/**
 * Internal DTO for requesting shipping label generation from the ShippingService.
 * This is NOT typically exposed directly via an API controller without transformation.
 */
export class LabelGenerationRequestDto {
  @IsString()
  merchantId: string;

  @ValidateNested()
  @Type(() => ShipmentDetailsModel)
  shipmentDetails: ShipmentDetailsModel;

  /**
   * The ID of the rate quote selected by the user/system.
   * This ID should be sufficient for the ShippingService to identify the chosen carrier and service.
   */
  @IsString()
  selectedRateId: string;

  /**
   * Preferred label format (e.g., 'PDF', 'PNG', 'ZPL').
   * If not provided, a default (e.g., 'PDF') will be used.
   */
  @IsOptional()
  @IsString()
  labelFormat?: string;

  /**
   * Optional parameters specific to label generation.
   * Example: package_level_details_override, insurance_details, signature_confirmation.
   * Structure can be flexible.
   */
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}