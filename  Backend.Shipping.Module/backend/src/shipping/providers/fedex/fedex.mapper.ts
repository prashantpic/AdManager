import { Injectable, Logger } from '@nestjs/common';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { FedExApiDtos } from './dto/fedex-api.dtos';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { TrackingEventModel } from '../../core/models/tracking-event.model';
import { AddressModel } from '../../core/models/address.model';
import { LabelGenerationFailedError } from '../../common/errors/shipping.errors';
import { ParcelModel } from '../../core/models/parcel.model';

@Injectable()
export class FedExMapper {
  private readonly logger = new Logger(FedExMapper.name);
  /**
   * Maps internal ShipmentDetailsModel to FedEx Rate Request DTO.
   * @param details The shipment details.
   * @param accountNumber The FedEx account number.
   * @returns FedExRateRequestDto
   */
  toFedExRateRequest(details: ShipmentDetailsModel, accountNumber: string): FedExApiDtos.FedExRateRequestDto {
    // Basic mapping - needs expansion for all fields and options
    return {
      accountNumber: {
        value: accountNumber,
      },
      requestedShipment: {
        shipper: {
          address: this.toFedExAddress(details.originAddress),
           contact: this.toFedExContact(details.originAddress),
        },
        recipient: {
          address: this.toFedExAddress(details.destinationAddress),
           contact: this.toFedExContact(details.destinationAddress),
        },
        // Assuming one package for simplicity, needs complex logic for multi-piece shipments
        requestedPackageLineItems: details.parcels.map((parcel, index) => this.toFedExPackageLineItem(parcel, index + 1, details)),
        // You might need to determine service type preferences based on rules or request
        // For rating, often you omit serviceType to get all applicable services
      },
       // Add other required fields like system/client info, preferred currency, etc.
    };
  }

  /**
   * Maps FedEx Rate Response DTO to internal ShippingRateQuoteModel array.
   * @param response The FedEx rate response.
   * @returns Array of ShippingRateQuoteModel.
   */
  fromFedExRateResponse(response: FedExApiDtos.FedExRateResponseDto): ShippingRateQuoteModel[] {
    const quotes: ShippingRateQuoteModel[] = [];

    if (response?.output?.rateReplyDetails) {
      for (const rateDetail of response.output.rateReplyDetails) {
           // FedEx response can have multiple ratedShipmentDetails per serviceType (e.g., list vs negotiated)
           // Pick one, usually the first or prioritized one (e.g., negotiated if available)
           const shipmentRateDetail = rateDetail.ratedShipmentDetails?.[0]?.shipmentRateDetail;

           if (shipmentRateDetail) {
                const quote = new ShippingRateQuoteModel();
                // Generate a unique ID, potentially including carrier/service/rate type info
                quote.id = `${CarrierCode.FEDEX}-${rateDetail.serviceType}-${Math.random().toString(36).substr(2, 9)}`; // Example ID
                quote.carrierCode = CarrierCode.FEDEX;
                quote.serviceCode = rateDetail.serviceType;
                quote.serviceName = rateDetail.serviceName || rateDetail.serviceType; // Use name if available
                quote.amount = shipmentRateDetail.totalNetCharge.amount;
                quote.currency = shipmentRateDetail.totalNetCharge.currency;

                // Map estimated delivery details
                if (rateDetail.commitDetails?.estimatedDeliveryTimestamp) {
                    quote.estimatedDeliveryDateMax = new Date(rateDetail.commitDetails.estimatedDeliveryTimestamp);
                    // FedEx might not always provide min date or delivery days directly in this structure;
                    // parsing timestamp or using separate APIs might be needed.
                }

                // Map surcharges
                 if (shipmentRateDetail.surcharges) {
                     quote.surcharges = shipmentRateDetail.surcharges.map(s => ({
                         type: s.type,
                         amount: s.amount.amount,
                         currency: s.amount.currency,
                         description: s.description,
                     }));
                 }

                // Store original response part if needed for label generation later
                quote.originalProviderRate = shipmentRateDetail; // Or a serialized version

                quotes.push(quote);
           }
      }
    }

    return quotes;
  }

  /**
   * Maps internal ShipmentDetailsModel and selected rate to FedEx Label Request DTO.
   * @param details The shipment details.
   * @param selectedRate The selected rate quote (contains info from the rate response).
   * @param accountNumber The FedEx account number.
   * @returns FedExLabelRequestDto
   */
  toFedExLabelRequest(details: ShipmentDetailsModel, selectedRate: ShippingRateQuoteModel, accountNumber: string): FedExApiDtos.FedExLabelRequestDto {
     if (selectedRate.carrierCode !== CarrierCode.FEDEX) {
         throw new Error(`Rate ID ${selectedRate.id} is not for FedEx.`);
     }

     // This mapping is highly dependent on the structure saved in selectedRate.originalProviderRate
     // and the complexity of the FedEx Label API. This is a simplified example.
    return {
      accountNumber: {
        value: accountNumber,
      },
      requestedShipment: {
         shipper: {
             address: this.toFedExAddress(details.originAddress),
              contact: this.toFedExContact(details.originAddress),
         },
         recipient: {
             address: this.toFedExAddress(details.destinationAddress),
              contact: this.toFedExContact(details.destinationAddress),
         },
         packages: details.parcels.map((parcel, index) => this.toFedExPackageLineItem(parcel, index + 1, details)),
         serviceType: selectedRate.serviceCode, // Use the service code from the rate
         // You might need to re-map weights, dimensions, etc. even though they were in the rate request
         // and might be available in selectedRate.originalProviderRate

         labelSpecification: {
             imageType: 'PDF', // Assume PDF for now, could be configurable
             labelStockType: 'PAPER_85X11_LABEL_CENTERED', // Or thermal label sizes
             // Add other label options like references, customs info, etc.
         },
          // Add payment details (e.g., BILL_ACCOUNT) and other required fields
          shippingChargesPayment: {
             paymentType: 'SENDER', // Assuming merchant pays
             payor: {
                 accountNumber: {
                     value: accountNumber,
                 },
             },
          },
           // Add customs details for international shipments
           // Add duties/taxes payment if applicable
      },
       // Add other required request parameters
    };
  }

  /**
   * Maps FedEx Label Response DTO to internal ShippingLabelModel.
   * @param response The FedEx label response.
   * @returns ShippingLabelModel.
   */
  fromFedExLabelResponse(response: FedExApiDtos.FedExLabelResponseDto): ShippingLabelModel {
    // Assuming a single shipment response with potentially multiple piece responses
    const transactionShipment = response?.output?.transactionShipments?.[0];
    const pieceResponse = transactionShipment?.pieceResponses?.[0]; // Get the first piece/package label

    if (!pieceResponse?.label?.image || !transactionShipment?.masterTrackingNumber) {
        throw new LabelGenerationFailedError('FedEx label response missing label data or tracking number.');
    }

    const label = new ShippingLabelModel();
    label.carrierCode = CarrierCode.FEDEX;
    label.trackingNumber = transactionShipment.masterTrackingNumber; // Or pieceResponse.trackingNumber
    label.labelData = pieceResponse.label.image; // Base64 data
    label.labelFormat = pieceResponse.label.type; // e.g., 'PDF'
    // FedEx response might not directly provide a public URL, often it's Base64

    return label;
  }


    /**
     * Maps FedEx Tracking Response DTO to internal TrackingDetailsModel.
     * @param response The FedEx tracking response.
     * @returns TrackingDetailsModel.
     */
    fromFedExTrackingResponse(response: FedExApiDtos.FedExTrackingResponseDto): TrackingDetailsModel | null {
        const trackResult = response?.output?.completeTrackResults?.[0];
        if (!trackResult?.trackingNumber) {
            return null; // Or throw a specific tracking not found error
        }

        const trackingDetails = new TrackingDetailsModel();
        trackingDetails.trackingNumber = trackResult.trackingNumber;
        trackingDetails.carrierCode = CarrierCode.FEDEX;
        trackingDetails.currentStatus = trackResult.shipment?.latestStatusDetail?.code || 'UNKNOWN';
        trackingDetails.statusDescription = trackResult.shipment?.latestStatusDetail?.description;
        if (trackResult.shipment?.estimatedDeliveryTimestamp) {
             trackingDetails.estimatedDeliveryDate = new Date(trackResult.shipment.estimatedDeliveryTimestamp);
        }

        // Map tracking events
        trackingDetails.events = trackResult.trackingEvents?.map(event => this.fromFedExTrackingEvent(event)) || [];

        // Sort events by timestamp ascending
        trackingDetails.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return trackingDetails;
    }

  // --- Helper mapping functions ---

  private toFedExAddress(address: AddressModel): FedExApiDtos.FedExAddressDto {
    return {
      streetLines: [address.street1, address.street2].filter((line): line is string => !!line),
      city: address.city,
      stateOrProvinceCode: address.stateProvince, // Ensure this is the correct format (code)
      postalCode: address.postalCode,
      countryCode: address.countryCode, // Ensure this is the correct format (ISO 2 letter)
      residential: address.isResidential,
    };
  }

   private toFedExContact(address: AddressModel): FedExApiDtos.FedExContactDto {
       return {
           personName: address.contactName,
           companyName: address.companyName,
           phoneNumber: address.phoneNumber,
           // emailAddress: ... add email if available in AddressModel or context
       };
   }

    private toFedExPackageLineItem(parcel: ParcelModel, sequence: number, shipmentDetails: ShipmentDetailsModel): FedExApiDtos.FedExPackageLineItemDto {
       // Need to handle weight/dimension unit conversion if FedEx API expects specific units
       const itemDescription = shipmentDetails.lineItems.map(item => `${item.quantity}x ${item.name}`).join(', ');

       return {
           sequenceNumber: sequence,
           weight: {
               value: parcel.weight,
               units: parcel.weightUnit === 'KG' ? 'KG' : 'LB', // Example conversion
           },
           dimensions: {
               length: parcel.length,
               width: parcel.width,
               height: parcel.height,
               units: parcel.dimensionUnit === 'CM' ? 'CM' : 'IN', // Example conversion
           },
            itemDescription: itemDescription.substring(0,100), // Max length
            declaredValue: parcel.value !== undefined ? { amount: parcel.value, currency: parcel.currency || shipmentDetails.currency } : undefined,
       };
    }

     private fromFedExTrackingEvent(event: FedExApiDtos.FedExTrackingEventDto): TrackingEventModel {
         const trackingEvent = new TrackingEventModel();
         trackingEvent.timestamp = new Date(event.timestamp);
         trackingEvent.status = event.eventType;
         trackingEvent.description = event.eventDescription;
         if (event.address) {
             trackingEvent.location = this.fromFedExAddress(event.address);
         }
         // Add other fields if needed
         return trackingEvent;
     }

     private fromFedExAddress(fedexAddress: FedExApiDtos.FedExAddressDto): AddressModel {
         const address = new AddressModel();
         address.street1 = fedexAddress.streetLines[0] || '';
         address.street2 = fedexAddress.streetLines[1];
         address.city = fedexAddress.city;
         address.stateProvince = fedexAddress.stateOrProvinceCode;
         address.postalCode = fedexAddress.postalCode;
         address.countryCode = fedexAddress.countryCode;
         address.isResidential = fedexAddress.residential;
         // Note: Contact details from tracking event address are not usually included in this AddressModel
         return address;
     }
}