import { CarrierCode } from '../enums/carrier-code.enum';
import { ShipmentDetailsModel } from '../models/shipment-details.model';
import { ShippingRateQuoteModel } from '../models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../models/shipping-label.model';
import { TrackingDetailsModel } from '../models/tracking-details.model';
import { MerchantConfigModel } from '../models/merchant-config.model';

export interface IShippingProvider {
  /**
   * Returns the unique code for the shipping carrier this provider integrates with.
   */
  getProviderCode(): CarrierCode;

  /**
   * Fetches shipping rate quotes for a given shipment.
   * @param shipmentDetails Details of the shipment (origin, destination, parcels, items).
   * @param merchantConfig Merchant's specific configuration for this provider.
   * @returns A promise resolving to an array of available rate quotes.
   */
  getRates(
    shipmentDetails: ShipmentDetailsModel,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingRateQuoteModel[]>;

  /**
   * Generates a shipping label for a specific shipment and selected rate.
   * Note: FallbackProvider would not support this.
   * @param shipmentDetails Details of the shipment.
   * @param selectedRateId The ID of the selected rate quote (this ID should be sufficient to reconstruct or retrieve necessary rate details for the provider).
   * @param merchantConfig Merchant's specific configuration for this provider.
   * @returns A promise resolving to the generated shipping label details.
   */
  createLabel(
    shipmentDetails: ShipmentDetailsModel,
    selectedRateId: string, // Or potentially the full ShippingRateQuoteModel if complex original rate data is needed
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingLabelModel>;

  /**
   * Retrieves tracking information for a given tracking number.
   * Note: FallbackProvider would not support this.
   * @param trackingNumber The tracking number.
   * @param merchantConfig Merchant's specific configuration for this provider (may be needed for authenticated tracking).
   * @returns A promise resolving to the tracking details.
   */
  getTrackingDetails(
    trackingNumber: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<TrackingDetailsModel>;
}