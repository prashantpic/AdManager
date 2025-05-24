import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { CarrierCode } from '../../core/enums/carrier-code.enum'; // Assuming this enum exists

/**
 * Internal DTO for requesting shipment tracking information from the ShippingService.
 * This is NOT typically exposed directly via an API controller without transformation.
 */
export class TrackingInfoRequestDto {
  @IsString()
  merchantId: string;

  @IsString()
  trackingNumber: string;

  /**
   * Optional hint if the carrier is known.
   * If not provided, ShippingService may attempt to infer or query multiple providers.
   */
  @IsOptional()
  @IsEnum(CarrierCode)
  carrierCodeHint?: CarrierCode;

  /**
   * Optional parameters specific to tracking.
   * Example: level_of_detail (e.g., 'SUMMARY', 'FULL_HISTORY').
   * Structure can be flexible.
   */
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}