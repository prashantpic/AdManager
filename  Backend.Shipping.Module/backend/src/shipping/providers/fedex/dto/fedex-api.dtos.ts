// This file would contain interfaces/types mirroring the FedEx API request/response structures.
// Example (simplified):

export namespace FedExApiDtos {
    // Request DTOs
    export interface FedExRateRequestDto {
        accountNumber: {
            value: string;
        };
        requestedShipment: {
            shipper: {
                address: FedExAddressDto;
                contact?: FedExContactDto;
            };
            recipient: {
                address: FedExAddressDto;
                contact?: FedExContactDto;
            };
            // ... other shipment details like packages, service type preference, etc.
            requestedPackageLineItems: FedExPackageLineItemDto[];
        };
        // ... other request parameters
    }

    export interface FedExLabelRequestDto {
        accountNumber: {
            value: string;
        };
        requestedShipment: {
            // ... shipment details, must match details used for rating
            shipper: { address: FedExAddressDto, contact?: FedExContactDto };
            recipient: { address: FedExAddressDto, contact?: FedExContactDto };
            packages: FedExPackageLineItemDto[];
            // ... reference to the selected rate/service
            serviceType: string; // e.g., 'FEDEX_GROUND'
            // ... label specification
            labelSpecification: {
                imageType: string; // e.g., 'PDF'
                labelStockType: string; // e.g., 'PAPER_85X11_LABEL_CENTERED'
            };
            shippingChargesPayment: {
                paymentType: string; // SENDER, RECIPIENT, THIRD_PARTY
                payor: {
                    accountNumber: { value: string };
                    // ... potentially other payor details like address
                };
            };
        };
        // ... other parameters
    }

     export interface FedExTrackingRequestDto {
         trackingNumberInfo: {
             trackingNumber: string;
         };
         // ... other parameters like carrier code, options
     }


    // Response DTOs
    export interface FedExRateResponseDto {
        output: {
            rateReplyDetails: FedExRateReplyDetailDto[];
            // ... other response data
        };
        // ... status and transaction details
    }

    export interface FedExRateReplyDetailDto {
        serviceType: string; // e.g., 'FEDEX_GROUND'
        serviceName?: string;
        // ... rating details
        ratedShipmentDetails: {
             shipmentRateDetail: {
                 totalNetCharge: { // The final cost
                     amount: number;
                     currency: string;
                 };
                 totalBaseCharge?: { // Base cost before surcharges
                     amount: number;
                     currency: string;
                 };
                  surcharges?: FedExSurchargeDto[]; // List of surcharges
                 // ... other charges
             };
        }[]; // Array of rates (e.g., list rates, negotiated rates)
        commitDetails?: { // Estimated delivery info
            estimatedDeliveryTime?: string; // ISO 8601 date-time
            estimatedDeliveryTimestamp?: string; // ISO 8601 date-time
        };
        // ... other details
    }

     export interface FedExLabelResponseDto {
         output: {
             transactionShipments: {
                 masterTrackingNumber?: string; // The generated tracking number
                 // ... other shipment details
                 pieceResponses: { // Label data for each package/piece
                     trackingNumber?: string;
                     packageSequenceNumber?: number;
                     label?: { // Label data
                         image: string; // Base64 encoded label image
                         type: string; // e.g., 'PDF'
                         // ... other label properties
                     };
                     // ... other piece details
                 }[];
                 // ... other shipment details
             }[];
             // ... other output data
         };
         // ... status and transaction details
     }

     export interface FedExTrackingResponseDto {
         output: {
             completeTrackResults: {
                 trackingNumber?: string;
                 trackingEvents?: FedExTrackingEventDto[];
                 shipment?: {
                     shipmentIdentificationDetail?: {
                         packageIdentifier?: { // Contains service type, weight, dimensions etc.
                             type?: string;
                             value?: string;
                         }[];
                         // ... other shipment details
                     };
                     latestStatusDetail?: { // Current status
                         code?: string;
                         description?: string;
                     };
                      estimatedDeliveryTimestamp?: string;
                      origin?: { // Origin address
                          address?: FedExAddressDto;
                      };
                      destination?: { // Destination address
                          address?: FedExAddressDto;
                      };
                     // ... more shipment level details
                 };
                 // ... other tracking properties
             }[];
         };
     }


    // Common DTOs used in requests/responses
    export interface FedExAddressDto {
        streetLines: string[];
        city: string;
        stateOrProvinceCode: string;
        postalCode: string;
        countryCode: string;
        residential?: boolean;
    }

    export interface FedExContactDto {
        personName?: string;
        companyName?: string;
        phoneNumber?: string;
        emailAddress?: string;
    }

    export interface FedExPackageLineItemDto {
         sequenceNumber?: number; // 1-based index
         // ... weight, dimensions, etc.
        weight?: {
            value: number;
            units: string; // 'LB', 'KG'
        };
        dimensions?: {
            length: number;
            width: number;
            height: number;
            units: string; // 'CM', 'IN'
        };
         // ... insured value, content description, etc.
         itemDescription?: string; // Could map line item names here
         declaredValue?: { // Total value of items in the package
             amount: number;
             currency: string;
         }
    }

     export interface FedExSurchargeDto {
        type: string; // e.g., 'FUEL', 'RESIDENTIAL_DELIVERY'
        description?: string;
        amount: {
            amount: number;
            currency: string;
        };
     }

     export interface FedExTrackingEventDto {
         timestamp: string; // ISO 8601 format
         eventType: string; // e.g., 'PU', 'AR', 'DL'
         eventDescription: string;
         address?: FedExAddressDto; // Location of the event
         // ... other event details
     }
}