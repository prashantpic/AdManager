import { Injectable, Logger } from '@nestjs/common';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { UPSApiDtos } from './dto/ups-api.dtos';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { TrackingEventModel } from '../../core/models/tracking-event.model';
import { AddressModel } from '../../core/models/address.model';
import { ParcelModel } from '../../core/models/parcel.model';
import { LabelGenerationFailedError } from '../../common/errors/shipping.errors';

@Injectable()
export class UPSMapper {
  private readonly logger = new Logger(UPSMapper.name);
  /**
   * Maps internal ShipmentDetailsModel to UPS Rate Request DTO.
   * @param details The shipment details.
   * @param accountNumber The UPS account number.
   * @returns UPSRateRequestDto
   */
  toUPSRateRequest(details: ShipmentDetailsModel, accountNumber: string): UPSApiDtos.UPSRateRequestDto {
    // Basic mapping - needs expansion for all fields and options
    return {
      RateRequest: {
        Request: { TransactionReference: { CustomerTransactionId: `ADM-${Date.now()}` } }, // Example transaction ID
        Shipment: {
          Shipper: {
            ShipperNumber: accountNumber,
            Address: this.toUPSAddress(details.originAddress),
             Name: details.originAddress?.companyName || details.originAddress?.contactName || 'Origin Contact',
          },
          ShipTo: {
            Address: this.toUPSAddress(details.destinationAddress),
             Name: details.destinationAddress?.companyName || details.destinationAddress?.contactName || 'Destination Contact',
          },
          ShipFrom: { // Often same as shipper, can omit if identical
             Address: this.toUPSAddress(details.originAddress),
             Name: details.originAddress?.companyName || details.originAddress?.contactName || 'Origin Contact',
          },
          Package: details.parcels.map(p => this.toUPSPackage(p, details)),
           Service: { Code: '03' }, // Example: Requesting only Ground rates. Omit for all services.
           ShipmentTotalWeight: this.toUPSWeight({ weight: details.totalWeight, unit: details.parcels[0]?.weightUnit || 'KG' }), // Assuming units consistent
        },
      },
    };
  }

  /**
   * Maps UPS Rate Response DTO to internal ShippingRateQuoteModel array.
   * @param response The UPS rate response.
   * @returns Array of ShippingRateQuoteModel.
   */
  fromUPSRateResponse(response: UPSApiDtos.UPSRateResponseDto): ShippingRateQuoteModel[] {
    const quotes: ShippingRateQuoteModel[] = [];

    if (response?.RateResponse?.RatedShipment) {
      for (const ratedShipment of response.RateResponse.RatedShipment) {
        // UPS response structure can be complex, check for negotiated rates first if preferred
        const charge = ratedShipment.NegotiatedRateCharges?.TotalCharge || ratedShipment.TotalCharges;

        if (charge) {
          const quote = new ShippingRateQuoteModel();
          // Generate a unique ID, potentially including carrier/service info
          quote.id = `${CarrierCode.UPS}-${ratedShipment.Service?.Code}-${Math.random().toString(36).substr(2, 9)}`; // Example ID
          quote.carrierCode = CarrierCode.UPS;
          quote.serviceCode = ratedShipment.Service?.Code || 'UNKNOWN';
          quote.serviceName = ratedShipment.Service?.Description || ratedShipment.Service?.Code || 'UNKNOWN';
          quote.amount = parseFloat(charge.MonetaryValue);
          quote.currency = charge.CurrencyCode;

          // Map estimated delivery details
          if (ratedShipment.GuaranteedDelivery) {
              // UPS can provide date or business days
              if (ratedShipment.GuaranteedDelivery.DeliveryByDate) {
                   // Parse YYYYMMDD date string
                   const dateStr = ratedShipment.GuaranteedDelivery.DeliveryByDate;
                   // Construct date object (Month is 0-indexed)
                   quote.estimatedDeliveryDateMax = new Date(parseInt(dateStr.substring(0,4)), parseInt(dateStr.substring(4,6)) - 1, parseInt(dateStr.substring(6,8)));
              } else if (ratedShipment.GuaranteedDelivery.BusinessDaysInTransit) {
                   quote.deliveryDays = parseInt(ratedShipment.GuaranteedDelivery.BusinessDaysInTransit, 10);
              }
          }

           // Surcharges are usually included in TotalCharge for UPS negotiated rates,
           // or listed separately in complex responses. Mapping surcharges would require
           // parsing the breakdown if available. Skipping for this simplified example.

          // Store original response part if needed for label generation later
          quote.originalProviderRate = ratedShipment; // Or a serialized version

          quotes.push(quote);
        }
      }
    }

    return quotes;
  }

  /**
   * Maps internal ShipmentDetailsModel and selected rate to UPS Label Request DTO.
   * @param details The shipment details.
   * @param selectedRate The selected rate quote.
   * @param accountNumber The UPS account number.
   * @returns UPSLabelRequestDto
   */
  toUPSLabelRequest(details: ShipmentDetailsModel, selectedRate: ShippingRateQuoteModel, accountNumber: string): UPSApiDtos.UPSLabelRequestDto {
     if (selectedRate.carrierCode !== CarrierCode.UPS) {
         throw new Error(`Rate ID ${selectedRate.id} is not for UPS.`);
     }

     // Needs careful mapping from selectedRate.originalProviderRate and shipment details
    return {
         ShipmentRequest: {
            Request: { TransactionReference: { CustomerTransactionId: `ADM-Label-${Date.now()}` } },
            Shipment: {
                 Shipper: {
                     ShipperNumber: accountNumber,
                     Address: this.toUPSAddress(details.originAddress),
                      Name: details.originAddress?.companyName || details.originAddress?.contactName || 'Origin Contact',
                 },
                 ShipTo: {
                     Address: this.toUPSAddress(details.destinationAddress),
                      Name: details.destinationAddress?.companyName || details.destinationAddress?.contactName || 'Destination Contact',
                 },
                 ShipFrom: {
                     Address: this.toUPSAddress(details.originAddress),
                      Name: details.originAddress?.companyName || details.originAddress?.contactName || 'Origin Contact',
                 },
                 Package: details.parcels.map(p => this.toUPSPackage(p, details)),
                 Service: { Code: selectedRate.serviceCode }, // Use the service code from the rate
                 PaymentInformation: { // How the shipment is paid for
                    ShipmentCharge: {
                        Type: '01', // Transportation Charges
                        BillShipper: {
                             AccountNumber: accountNumber,
                        },
                    },
                 },
                 ShipmentTotalWeight: this.toUPSWeight({ weight: details.totalWeight, unit: details.parcels[0]?.weightUnit || 'KG' }),
                  // Add description, reference number etc. if needed
                  Description: `Order ${selectedRate.id}`.substring(0,35), // Example description, max length 35
            },
            LabelSpecification: {
                 LabelImageFormat: { Code: 'PDF', Description: 'PDF' }, // Assume PDF, configure if needed
                 LabelStockSetting: { Type: '01', Description: '4x6' }, // Assume 4x6 thermal, configure if needed
            },
         },
    };
  }

  /**
   * Maps UPS Label Response DTO to internal ShippingLabelModel.
   * @param response The UPS label response.
   * @returns ShippingLabelModel.
   */
  fromUPSLabelResponse(response: UPSApiDtos.UPSLabelResponseDto): ShippingLabelModel {
    const shipmentResults = response?.ShipmentResponse?.ShipmentResults;
    const packageResult = shipmentResults?.PackageResults?.[0]; // Assuming one package for simplicity

    if (!packageResult?.ShippingLabel?.GraphicImage || !shipmentResults?.ShipmentIdentificationNumber) {
        throw new LabelGenerationFailedError('UPS label response missing label data or tracking number.');
    }

    const label = new ShippingLabelModel();
    label.carrierCode = CarrierCode.UPS;
    label.trackingNumber = shipmentResults.ShipmentIdentificationNumber; // Master tracking number
    // If multi-piece, might need packageResult.TrackingNumber and generate multiple labels
    label.labelData = packageResult.ShippingLabel.GraphicImage; // Base64 data
    label.labelFormat = packageResult.ShippingLabel.ImageFormat.Code; // e.g., 'PDF'
    // UPS does not typically provide a public URL directly in the response

    return label;
  }


    /**
     * Maps UPS Tracking Response DTO to internal TrackingDetailsModel.
     * @param response The UPS tracking response.
     * @returns TrackingDetailsModel.
     */
    fromUPSTrackingResponse(response: UPSApiDtos.UPSTrackingResponseDto): TrackingDetailsModel | null {
        const trackResult = response?.TrackResponse?.Shipment?.[0];
        if (!trackResult?.TrackingNumber) {
            return null; // Or throw a specific tracking not found error
        }

        const trackingDetails = new TrackingDetailsModel();
        trackingDetails.trackingNumber = trackResult.TrackingNumber;
        trackingDetails.carrierCode = CarrierCode.UPS;
        trackingDetails.currentStatus = trackResult.ShipmentPhase?.Description || trackResult.Activity?.[0]?.Status?.Description || 'UNKNOWN'; // Get current status
        trackingDetails.statusDescription = trackResult.Activity?.[0]?.Status?.Description || trackingDetails.currentStatus; // Use latest event description if available

        // Map estimated/actual delivery dates
        if (trackResult.EstimatedDeliveryDate) {
             // Parse YYYYMMDD
             const dateStr = trackResult.EstimatedDeliveryDate;
             trackingDetails.estimatedDeliveryDate = new Date(parseInt(dateStr.substring(0,4)), parseInt(dateStr.substring(4,6)) - 1, parseInt(dateStr.substring(6,8)));
        } else if (trackResult.DeliveryDate) {
             const dateStr = trackResult.DeliveryDate;
              trackingDetails.estimatedDeliveryDate = new Date(parseInt(dateStr.substring(0,4)), parseInt(dateStr.substring(4,6)) - 1, parseInt(dateStr.substring(6,8)));
        }

        // Map tracking events
        trackingDetails.events = trackResult.Activity?.map(activity => this.fromUPSTrackingActivity(activity)) || [];

         // Sort events by timestamp ascending
        trackingDetails.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());


        return trackingDetails;
    }

  // --- Helper mapping functions ---

  private toUPSAddress(address: AddressModel): UPSApiDtos.UPSAddressDto {
    return {
      AddressLine: [address.street1, address.street2].filter((line): line is string => !!line),
      City: address.city,
      StateProvinceCode: address.stateProvince, // Ensure this is the correct format (code)
      PostalCode: address.postalCode,
      CountryCode: address.countryCode, // Ensure this is the correct format (ISO 2 letter)
      ResidentialAddressIndicator: address.isResidential ? '1' : undefined, // UPS uses '1' or omits
    };
  }

   private toUPSPackage(parcel: ParcelModel, shipmentDetails: ShipmentDetailsModel): UPSApiDtos.UPSPackageDto {
       // Need to handle weight/dimension unit conversion and format as strings
       // Need to map packaging type (e.g., Customer Supplied '02')
       const packageDescription = shipmentDetails.lineItems.map(item => `${item.quantity}x ${item.name}`).join(', ').substring(0, 35);

       return {
           PackagingType: { Code: '02', Description: 'Customer Supplied' }, // Example default
           Dimensions: {
               UnitOfMeasurement: { Code: parcel.dimensionUnit === 'CM' ? 'CM' : 'IN', Description: parcel.dimensionUnit === 'CM' ? 'Centimeters' : 'Inches' },
               Length: parcel.length.toString(),
               Width: parcel.width.toString(),
               Height: parcel.height.toString(),
           },
           PackageWeight: {
               UnitOfMeasurement: { Code: parcel.weightUnit === 'KG' ? 'KGS' : 'LBS', Description: parcel.weightUnit === 'KG' ? 'Kilograms' : 'Pounds' },
               Weight: parcel.weight.toString(),
           },
            Description: packageDescription,
             // Add declared value if needed and available in ParcelModel
            PackageServiceOptions: parcel.value !== undefined ? {
                DeclaredValue: {
                     Type: '01', // Actual Value
                     CurrencyCode: parcel.currency || shipmentDetails.currency,
                     MonetaryValue: parcel.value.toFixed(2), // Format as string
                },
            } : undefined,
       };
   }

     private toUPSWeight(weightData: { weight: number, unit: string }): UPSApiDtos.UPSWeightDto {
          return {
               UnitOfMeasurement: { Code: weightData.unit === 'KG' ? 'KGS' : 'LBS', Description: weightData.unit === 'KG' ? 'Kilograms' : 'Pounds' },
               Weight: weightData.weight.toString(),
          };
     }

    private fromUPSTrackingActivity(activity: UPSApiDtos.UPSTrackingActivityDto): TrackingEventModel {
        const trackingEvent = new TrackingEventModel();
        // Combine Date and Time strings into a Date object
        const dateStr = activity.Date; // YYYYMMDD
        const timeStr = activity.Time; // HHMMSS
        // Handle potential timezone issues, UPS API often uses local time
        trackingEvent.timestamp = new Date(
            parseInt(dateStr.substring(0, 4)), // Year
            parseInt(dateStr.substring(4, 6)) - 1, // Month (0-indexed)
            parseInt(dateStr.substring(6, 8)), // Day
            parseInt(timeStr.substring(0, 2)), // Hour
            parseInt(timeStr.substring(2, 4)), // Minute
            parseInt(timeStr.substring(4, 6)) // Second
        );

        trackingEvent.status = activity.Status?.Type || activity.Status?.Code || 'UNKNOWN';
        trackingEvent.description = activity.Status?.Description || 'No description provided';

        if (activity.Location?.Address) {
            trackingEvent.location = this.fromUPSAddress(activity.Location.Address);
        }
         // Include signed for name if available
         if (activity.Location?.SignedForByName) {
             trackingEvent.signatureRecipient = activity.Location.SignedForByName;
         }

        return trackingEvent;
    }

    private fromUPSAddress(upsAddress: UPSApiDtos.UPSAddressDto): AddressModel {
        const address = new AddressModel();
        address.street1 = upsAddress.AddressLine[0] || '';
        address.street2 = upsAddress.AddressLine[1]; // Take second line if exists
        address.city = upsAddress.City;
        address.stateProvince = upsAddress.StateProvinceCode;
        address.postalCode = upsAddress.PostalCode;
        address.countryCode = upsAddress.CountryCode;
        // UPS residential indicator can be '1' or absent/other values
        address.isResidential = upsAddress.ResidentialAddressIndicator === '1';
        return address;
    }
}