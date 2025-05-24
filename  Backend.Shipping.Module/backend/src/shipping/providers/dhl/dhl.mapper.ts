import { Injectable, Logger } from '@nestjs/common';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { DHLApiDtos } from './dto/dhl-api.dtos';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { TrackingEventModel } from '../../core/models/tracking-event.model';
import { AddressModel } from '../../core/models/address.model';
import { ParcelModel } from '../../core/models/parcel.model';
import { DEFAULT_WEIGHT_UNIT, DEFAULT_VOLUME_UNIT } from '../../common/constants/shipping.constants';
import { LabelGenerationFailedError } from '../../common/errors/shipping.errors';

@Injectable()
export class DHLMapper {
  private readonly logger = new Logger(DHLMapper.name);
  /**
   * Maps internal ShipmentDetailsModel to DHL Rate Request DTO.
   * Uses DHL Express structure as example.
   * @param details The shipment details.
   * @returns DHLRateRequestDto
   */
  toDHLRateRequest(details: ShipmentDetailsModel): DHLApiDtos.DHLRateRequestDto {
    // Basic mapping - needs expansion for all fields and options
    // Assumes SI units (metric) or SU (imperial) based on configuration or data
    const unitOfMeasurement = details.parcels[0]?.dimensionUnit === 'CM' ? 'SI' : 'SU'; // Example unit handling
    const weightUnit = details.parcels[0]?.weightUnit || DEFAULT_WEIGHT_UNIT;
    const dimensionUnit = details.parcels[0]?.dimensionUnit || DEFAULT_VOLUME_UNIT;


    return {
      RequestedShipment: {
        ShipmentInfo: {
          DropOffType: 'REGULAR_PICKUP', // Example default
          UnitOfMeasurement: unitOfMeasurement,
          Packages: {
            RequestedPackages: details.parcels.map((p, i) => this.toDHLRequestedPackage(p, i + 1, weightUnit, dimensionUnit, details)),
          },
           // Add ShipmentDate if requested
           ShipmentDate: details.shipmentDate?.toISOString().split('T')[0], // YYYY-MM-DD
           ShipmentWeight: this.toDHLWeight({ value: details.totalWeight, unit: weightUnit }),
        },
        ShipmentDetails: {
            // ProductCode: 'P', // Example for DHL Express Worldwide 'P'
            // LocalServiceType: 'P',
        },
        From: {
           Address: this.toDHLAddress(details.originAddress),
        },
        To: {
           Address: this.toDHLAddress(details.destinationAddress),
        },
         // Add other required fields based on DHL API version and service type
      },
    };
  }

  /**
   * Maps DHL Rate Response DTO to internal ShippingRateQuoteModel array.
   * Uses DHL Express structure as example.
   * @param response The DHL rate response.
   * @returns Array of ShippingRateQuoteModel.
   */
  fromDHLRateResponse(response: DHLApiDtos.DHLRateResponseDto): ShippingRateQuoteModel[] {
    const quotes: ShippingRateQuoteModel[] = [];

    // Navigate the specific DHL Express response structure
    const services = response?.GetRateResponse?.Provider?.[0]?.Service; // Assuming one provider and services array

    if (services) {
      for (const service of services) {
        if (service.Type && service.ChargeValue !== undefined && service.ChargeCurrency) {
          const quote = new ShippingRateQuoteModel();
          // Generate a unique ID
          quote.id = `${CarrierCode.DHL}-${service.Type}-${Math.random().toString(36).substr(2, 9)}`; // Example ID
          quote.carrierCode = CarrierCode.DHL;
          quote.serviceCode = service.Type;
          quote.serviceName = service.Type; // DHL often uses Type as name, or requires separate lookup
          quote.amount = service.ChargeValue;
          quote.currency = service.ChargeCurrency;

          // Map estimated delivery details
          if (service.TotalTransitDays !== undefined) {
              quote.deliveryDays = service.TotalTransitDays;
          }
           if (service.DeliveryDate) {
                // Parse YYYY-MM-DD
                 quote.estimatedDeliveryDateMax = new Date(service.DeliveryDate);
           }

           // Map surcharges/items if available in the Items array
           if (service.Items) {
               // Filter items that are not the base price
               quote.surcharges = service.Items
                   .filter(item => item.Type !== 'BASE_PRICE')
                   .map(item => ({
                       type: item.Type,
                       amount: item.Price,
                       currency: item.Currency,
                       description: item.Description,
                   }));
           }


          // Check if it's a negotiated rate (if available in the response structure)
          if (service.ServiceFlags?.ProductAndServiceDirectIndirectUsage?.IsNegotiated === 'Y') {
               quote.isNegotiatedRate = true;
          }


          // Store original response part if needed for label generation later
          quote.originalProviderRate = service; // Store the whole service object

          quotes.push(quote);
        }
      }
    }

    return quotes;
  }

  /**
   * Maps internal ShipmentDetailsModel and selected rate to DHL Label Request DTO.
   * Uses DHL Express structure as example.
   * @param details The shipment details.
   * @param selectedRate The selected rate quote.
   * @param accountNumber The DHL account number.
   * @returns DHLLabelRequestDto
   */
  toDHLLabelRequest(details: ShipmentDetailsModel, selectedRate: ShippingRateQuoteModel, accountNumber: string): DHLApiDtos.DHLLabelRequestDto {
     if (selectedRate.carrierCode !== CarrierCode.DHL) {
         throw new Error(`Rate ID ${selectedRate.id} is not for DHL.`);
     }

     // Needs careful mapping from selectedRate.originalProviderRate and shipment details
     const weightUnit = details.parcels[0]?.weightUnit || DEFAULT_WEIGHT_UNIT;
     const dimensionUnit = details.parcels[0]?.dimensionUnit || DEFAULT_VOLUME_UNIT;
      const unitOfMeasurement = dimensionUnit === 'CM' ? 'SI' : 'SU'; // Example unit handling

    return {
         ShipmentRequest: {
             RequestedShipment: {
                 DropOffType: 'REGULAR_PICKUP', // Example default
                 ServiceType: selectedRate.serviceCode, // Use the service code from the rate
                 ShipmentDate: new Date().toISOString().split('.')[0], // Current datetime in YYYY-MM-DDTHH:MM:SS format
                 UnitOfMeasurement: unitOfMeasurement,
                 Content: details.lineItems.map(item => `${item.quantity} x ${item.name}`).join(', ').substring(0,99), // Basic content summary, max 99 chars for some DHL APIs
                 Shipper: this.toDHLShipper(details.originAddress, accountNumber),
                 Recipient: this.toDHLRecipient(details.destinationAddress),
                 ShippingCharge: {
                     Type: 'PC', // Payment by Shipper Account
                     AccountNumber: accountNumber,
                 },
                 Packages: {
                      RequestedPackages: details.parcels.map((p, i) => this.toDHLRequestedPackage(p, i + 1, weightUnit, dimensionUnit, details)),
                 },
                  // Add InternationalShipment details for international shipments
                  // Add value/currency at shipment level if needed
             },
              // Add request header/metadata like MessageReference, MessageTime
         },
    };
  }

  /**
   * Maps DHL Label Response DTO to internal ShippingLabelModel.
   * Uses DHL Express structure as example.
   * @param response The DHL label response.
   * @returns ShippingLabelModel.
   */
  fromDHLLabelResponse(response: DHLApiDtos.DHLLabelResponseDto): ShippingLabelModel {
    const labelImage = response?.ShipmentResponse?.LabelImage?.[0]; // Assuming one main label image

    if (!labelImage?.OutputImage || !response?.ShipmentResponse?.AirwayBillNumber) {
        throw new LabelGenerationFailedError('DHL label response missing label data or tracking number.');
    }

    const label = new ShippingLabelModel();
    label.carrierCode = CarrierCode.DHL;
    label.trackingNumber = response.ShipmentResponse.AirwayBillNumber; // AWB is the tracking number for Express
    label.labelData = labelImage.OutputImage; // Base64 data
    label.labelFormat = labelImage.OutputFormat || 'PDF'; // e.g., 'PDF'
    // DHL does not typically provide a public URL directly in the response

    return label;
  }


    /**
     * Maps DHL Tracking Response DTO to internal TrackingDetailsModel.
     * Uses DHL Express structure as example.
     * @param response The DHL tracking response.
     * @returns TrackingDetailsModel.
     */
    fromDHLTrackingResponse(response: DHLApiDtos.DHLTrackingResponseDto): TrackingDetailsModel | null {
        const shipment = response?.shipments?.[0]; // Assuming tracking one shipment

        if (!shipment?.trackingNumber) {
            return null; // Or throw a specific tracking not found error
        }

        const trackingDetails = new TrackingDetailsModel();
        trackingDetails.trackingNumber = shipment.trackingNumber;
        trackingDetails.carrierCode = CarrierCode.DHL;
        trackingDetails.currentStatus = shipment.status || 'UNKNOWN';
        trackingDetails.statusDescription = shipment.statusText;
        if (shipment.estimatedDeliveryDate) {
             // Parse YYYY-MM-DD
             trackingDetails.estimatedDeliveryDate = new Date(shipment.estimatedDeliveryDate);
        }

        // Map tracking events
        trackingDetails.events = shipment.events?.map(event => this.fromDHLTrackingEvent(event)) || [];

         // Sort events by timestamp ascending
        trackingDetails.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());


        return trackingDetails;
    }

  // --- Helper mapping functions ---

   private toDHLAddress(address: AddressModel): DHLApiDtos.DHLAddressDto {
       return {
           StreetLines: [address.street1, address.street2].filter((line): line is string => !!line),
           City: address.city,
           StateOrProvinceCode: address.stateProvince, // Ensure correct format
           PostalCode: address.postalCode,
           CountryCode: address.countryCode, // Ensure correct format (ISO 2 letter)
           // DHL AddressDto might not have isResidential field directly
       };
   }

    private toDHLShipper(address: AddressModel, accountNumber: string): DHLApiDtos.DHLShipperDto {
        return {
            StreetLines: [address.street1, address.street2].filter((line): line is string => !!line),
            City: address.city,
            StateOrProvinceCode: address.stateProvince,
            PostalCode: address.postalCode,
            CountryCode: address.countryCode,
            Contact: {
                PersonName: address.contactName,
                PhoneNumber: address.phoneNumber,
            },
             CompanyName: address.companyName,
             // Shipper DTO might need account number implicitly or in headers
        };
    }

     private toDHLRecipient(address: AddressModel): DHLApiDtos.DHLRecipientDto {
        return {
            StreetLines: [address.street1, address.street2].filter((line): line is string => !!line),
            City: address.city,
            StateOrProvinceCode: address.stateProvince,
            PostalCode: address.postalCode,
            CountryCode: address.countryCode,
            Contact: {
                PersonName: address.contactName,
                PhoneNumber: address.phoneNumber,
            },
             CompanyName: address.companyName,
             // Add residential indicator if supported by DHL API
        };
    }

    private toDHLRequestedPackage(parcel: ParcelModel, number: number, weightUnit: string, dimensionUnit: string, shipmentDetails: ShipmentDetailsModel): DHLApiDtos.DHLRequestedPackageDto {
       // Need to handle weight/dimension unit conversion if DHL API expects specific units (SI/SU)
       const packageContent = shipmentDetails.lineItems.map(item => `${item.quantity}x ${item.name}`).join(', ').substring(0,99);

       return {
           Number: number,
           Weight: this.toDHLWeight({ value: parcel.weight, unit: weightUnit }),
           Dimensions: this.toDHLDimensions({ length: parcel.length, width: parcel.width, height: parcel.height, unit: dimensionUnit }),
           Content: packageContent, // Or map from line items, or parcel.description
           DeclaredValue: parcel.value,
           DeclaredValueCurrency: parcel.currency || shipmentDetails.currency,
       };
    }

     private toDHLWeight(weightData: { value: number, unit: string }): DHLApiDtos.DHLWeightDto {
          return {
               UnitOfMeasurement: weightData.unit === 'KG' ? 'KG' : 'LB', // Use KG/LB codes
               Value: weightData.value,
          };
     }

     private toDHLDimensions(dimensionData: { length: number, width: number, height: number, unit: string }): DHLApiDtos.DHLDimensionsDto {
          return {
               UnitOfMeasurement: dimensionData.unit === 'CM' ? 'CM' : 'IN', // Use CM/IN codes
               Length: dimensionData.length,
               Width: dimensionData.width,
               Height: dimensionData.height,
          };
     }

    private fromDHLTrackingEvent(event: DHLApiDtos.DHLTrackingEventDto): TrackingEventModel {
        const trackingEvent = new TrackingEventModel();
        // Parse the ISO 8601 timestamp
        trackingEvent.timestamp = new Date(event.timestamp || '');

        trackingEvent.status = event.statusCode || event.status || 'UNKNOWN';
        trackingEvent.description = event.description || event.status || 'No description provided';

        if (event.location?.address) {
             // DHL tracking location address is simplified, map to AddressModel
            const address = new AddressModel();
            address.countryCode = event.location.address.countryCode || '';
            address.postalCode = event.location.address.postalCode || '';
            address.city = event.location.address.addressLocality || '';
             // Other address lines might not be available
            trackingEvent.location = address;
        }
         // Include signed for name if available
         if (event.signatory) {
             trackingEvent.signatureRecipient = event.signatory;
         }

        return trackingEvent;
    }
}