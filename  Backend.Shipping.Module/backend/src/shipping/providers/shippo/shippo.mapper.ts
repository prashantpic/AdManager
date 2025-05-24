import { Injectable, Logger } from '@nestjs/common';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { ShippoApiDtos } from './dto/shippo-api.dtos';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { TrackingEventModel } from '../../core/models/tracking-event.model';
import { AddressModel } from '../../core/models/address.model';
import { ParcelModel } from '../../core/models/parcel.model';
import { LabelGenerationFailedError } from '../../common/errors/shipping.errors';

@Injectable()
export class ShippoMapper {
  private readonly logger = new Logger(ShippoMapper.name);
  /**
   * Maps internal ShipmentDetailsModel to Shippo Shipment Create Request DTO.
   * @param details The shipment details.
   * @param carrierAccountIds Optional array of Shippo carrier account object_ids to filter by.
   * @returns ShippoShipmentCreateRequestDto
   */
  toShippoShipmentCreateRequest(details: ShipmentDetailsModel, carrierAccountIds?: string[]): ShippoApiDtos.ShippoShipmentCreateRequestDto {
    // Basic mapping - needs expansion for all fields and options
    return {
      address_from: this.toShippoAddress(details.originAddress),
      address_to: this.toShippoAddress(details.destinationAddress),
      parcels: details.parcels.map(p => this.toShippoParcel(p)),
      // Shippo allows metadata, could include order ID, merchant ID etc.
      metadata: `Merchant:${details.originAddress?.companyName || details.originAddress?.contactName}`, // Example metadata
      async: false, // Request synchronous rate calculation
      carrier_accounts: carrierAccountIds, // Filter by specific accounts if provided
       // Add customs declaration for international shipments
    };
  }

  /**
   * Maps Shippo Shipment Response (containing rates) to internal ShippingRateQuoteModel array.
   * @param response The Shippo shipment response.
   * @returns Array of ShippingRateQuoteModel.
   */
  fromShippoRateResponse(response: ShippoApiDtos.ShippoShipmentResponseDto): ShippingRateQuoteModel[] {
    const quotes: ShippingRateQuoteModel[] = [];

    if (response?.rates) {
      for (const rate of response.rates) {
        if (rate.object_id && rate.provider && rate.servicelevel?.name && rate.amount !== undefined && rate.currency) {
          const quote = new ShippingRateQuoteModel();
          // Shippo's rate object_id is the ID we need for label creation
          quote.id = rate.object_id;
          // Map Shippo's provider code to our internal CarrierCode enum
          // This mapping requires knowing the Shippo provider codes (e.g., 'usps', 'fedex', 'dhl_express', 'ups')
          quote.carrierCode = this.mapShippoCarrierCodeToInternal(rate.provider);
          quote.serviceCode = rate.servicelevel.token || rate.servicelevel.name; // Use token if available, otherwise name
          quote.serviceName = rate.servicelevel.name;
          quote.amount = parseFloat(rate.amount);
          quote.currency = rate.currency;

          // Map estimated delivery details
          if (rate.estimated_days !== undefined) {
              quote.deliveryDays = rate.estimated_days;
          }
           if (rate.estimated_delivery_date) {
                // Parse ISO 8601 string
                 quote.estimatedDeliveryDateMax = new Date(rate.estimated_delivery_date);
           }

           // Shippo often includes messages (warnings, info) on rates, could map these to description
           if(rate.messages && rate.messages.length > 0){
               quote.description = rate.messages.map(m => m.text).join('; ');
           }

          // Store original rate object if needed for label creation later
          quote.originalProviderRate = rate; // Store the whole rate object

          quotes.push(quote);
        }
      }
    }

    return quotes;
  }


    /**
     * Maps internal selected rate quote to Shippo Transaction Create Request DTO.
     * @param selectedRate The selected rate quote.
     * @returns ShippoTransactionCreateRequestDto
     */
    toShippoTransactionCreateRequest(selectedRate: ShippingRateQuoteModel): ShippoApiDtos.ShippoTransactionCreateRequestDto {
         if (selectedRate.carrierCode === CarrierCode.FALLBACK) {
              throw new Error(`Cannot create Shippo label from Fallback rate.`);
         }

         // The key here is using the Shippo rate object_id stored in selectedRate.id
         return {
              rate: selectedRate.id, // This must be the object_id from the Shippo rate response
              label_file_type: 'PDF', // Assume PDF, could be configurable
              // Add other options if needed (e.g., customs_declaration if international)
         };
    }

  /**
   * Maps Shippo Transaction Response to internal ShippingLabelModel.
   * @param response The Shippo transaction response.
   * @returns ShippingLabelModel.
   */
  fromShippoTransactionResponse(response: ShippoApiDtos.ShippoTransactionResponseDto): ShippingLabelModel {
    // Shippo transaction status should be 'SUCCESS'
    if (response.object_status !== 'SUCCESS' || !response.tracking_number || !response.label_url) {
         // Log specific messages from response.messages if available
         this.logger.error('Shippo Transaction Response Error:', response.messages);
        throw new LabelGenerationFailedError('Shippo label transaction failed.');
    }

    const label = new ShippingLabelModel();
    // Map Shippo's provider code to our internal CarrierCode enum if needed,
    // or use the carrierCode from the selectedRate if available (better practice).
    // Shippo transaction response includes the 'carrier' field (e.g., 'usps', 'fedex').
    label.carrierCode = this.mapShippoCarrierCodeToInternal(response.original_carrier || ''); // Use original carrier if available, or map Shippo's carrier

    label.trackingNumber = response.tracking_number;
    // Shippo provides a label_url, we might fetch it or provide the URL directly
    // For simplicity here, let's just store the URL. If base64 is needed, we'd fetch it.
    // The description says 'label image URL or base64 encoded data'. Storing URL is simpler.
    label.labelUrl = response.label_url;
    // Shippo's transaction response also has label_file_type
    label.labelFormat = response.label_file_type || 'PDF';
    // labelData could be left empty if using labelUrl, or fetched separately

    return label;
  }


    /**
     * Maps Shippo Tracking Response to internal TrackingDetailsModel.
     * @param response The Shippo tracking response.
     * @returns TrackingDetailsModel.
     */
    fromShippoTrackingResponse(response: ShippoApiDtos.ShippoTrackingResponseDto): TrackingDetailsModel | null {
        if (!response?.tracking_number) {
            return null; // Or throw a specific tracking not found error
        }

        const trackingDetails = new TrackingDetailsModel();
        trackingDetails.trackingNumber = response.tracking_number;
        // Map Shippo's carrier code to our internal CarrierCode enum
        trackingDetails.carrierCode = this.mapShippoCarrierCodeToInternal(response.carrier || response.original_carrier || '');

        // Use current status details
        trackingDetails.currentStatus = response.tracking_status?.status || 'UNKNOWN';
        trackingDetails.statusDescription = response.tracking_status?.status_details;

        if (response.eta) {
             // Parse ISO 8601 timestamp for estimated delivery
             trackingDetails.estimatedDeliveryDate = new Date(response.eta);
        }

        // Map tracking history events
        trackingDetails.events = response.tracking_history?.map(event => this.fromShippoTrackingEvent(event)) || [];

         // Sort events by timestamp ascending
        trackingDetails.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return trackingDetails;
    }

  // --- Helper mapping functions ---

  private toShippoAddress(address: AddressModel): ShippoApiDtos.ShippoAddressDto {
    // Shippo requires 'state' and 'zip' fields
    return {
      name: address.contactName,
      company: address.companyName,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.stateProvince, // Use state code
      zip: address.postalCode,
      country: address.countryCode, // ISO 2 letter code
      phone: address.phoneNumber,
      // email: ... add email if available
      is_residential: address.isResidential || false, // Default to false if undefined
    };
  }

   private toShippoParcel(parcel: ParcelModel): ShippoApiDtos.ShippoParcelDto {
       // Shippo expects dimensions and weight as strings, requires units
       return {
           length: parcel.length.toString(),
           width: parcel.width.toString(),
           height: parcel.height.toString(),
           distance_unit: parcel.dimensionUnit?.toLowerCase() || 'cm', // Default if not provided, Shippo uses lowercase
           weight: parcel.weight.toString(),
           mass_unit: parcel.weightUnit?.toLowerCase() || 'kg', // Default if not provided, Shippo uses lowercase
            // Add description or value if needed and available
            metadata: parcel.description, // Example: using description field for metadata
            // Shippo has specific fields for declared value if needed
       };
   }

    private fromShippoTrackingEvent(event: ShippoApiDtos.ShippoTrackingEventDto): TrackingEventModel {
        const trackingEvent = new TrackingEventModel();
        // Parse the ISO 8601 timestamp
        trackingEvent.timestamp = new Date(event.object_created || '');

        trackingEvent.status = event.object_status || event.status_details || 'UNKNOWN';
        trackingEvent.description = event.status_details || 'No description provided';

        if (event.location) {
            // Map Shippo location to AddressModel
            const address = new AddressModel();
            address.countryCode = event.location.country || '';
            address.postalCode = event.location.zip || '';
            address.city = event.location.city || '';
            address.stateProvince = event.location.state || '';
            // Shippo location does not typically include street addresses
            trackingEvent.location = address;
        }
        // Include signed for name if available
        if (event.signature?.name) {
            trackingEvent.signatureRecipient = event.signature.name;
        }

        return trackingEvent;
    }

    /**
     * Maps a Shippo internal carrier code string to our internal CarrierCode enum.
     * This mapping is crucial for the multi-carrier provider.
     * @param shippoCode The carrier code string from Shippo (e.g., 'usps', 'fedex', 'dhl_express').
     * @returns The corresponding internal CarrierCode. Defaults to SHIPPO or throws if unknown.
     */
    private mapShippoCarrierCodeToInternal(shippoCode: string): CarrierCode {
        switch (shippoCode?.toLowerCase()) {
            case 'usps':
                return CarrierCode.SHIPPO; // Or have a USPS enum? Sticking to defined enums.
            case 'fedex':
                return CarrierCode.FEDEX;
            case 'ups':
                return CarrierCode.UPS;
            case 'dhl_express':
            case 'dhl_global_mail': // Example for other DHL services
                 return CarrierCode.DHL;
            // Add mappings for other carriers Shippo supports if needed in the enum
            default:
                this.logger.warn(`Unknown Shippo carrier code encountered: ${shippoCode}. Mapping to SHIPPO.`);
                return CarrierCode.SHIPPO; // Map unknown Shippo carriers to the generic SHIPPO provider code
        }
    }
}