// This file would contain interfaces/types mirroring the UPS API request/response structures.
// Example (simplified):

export namespace UPSApiDtos {
    // Request DTOs
    export interface UPSRateRequestDto {
        RateRequest: {
            Request?: {
                TransactionReference?: {
                    CustomerTransactionId: string;
                };
            };
            Shipment: {
                Shipper: UPSShipperDto;
                ShipTo: UPSShipToDto;
                ShipFrom?: UPSShipFromDto; // Often same as Shipper, but can be different
                Package: UPSPackageDto[];
                Service?: UPSServiceDto; // Can specify service preference, or omit for all
                ShipmentTotalWeight?: UPSWeightDto; // Total calculated weight
                 // ... other shipment options
            };
            // ... other request parameters
        };
    }

    export interface UPSLabelRequestDto {
         ShipmentRequest: {
            Request?: {
                 TransactionReference?: {
                    CustomerTransactionId: string;
                };
            };
             Shipment: {
                Shipper: UPSShipperDto;
                ShipTo: UPSShipToDto;
                ShipFrom?: UPSShipFromDto; // Often same as Shipper, but can be different
                Package: UPSPackageDto[];
                Service: UPSServiceDto; // Must specify service
                PaymentInformation: UPSPaymentInformationDto;
                ShipmentTotalWeight?: UPSWeightDto;
                 Description?: string; // Shipment description
                 // ... other shipment options (e.g., references)
             };
             LabelSpecification: UPSLabelSpecificationDto;
             // ... other request parameters
         };
    }

     export interface UPSTrackingRequestDto {
         TrackRequest: {
             Request?: {
                 TransactionReference?: {
                     CustomerTransactionId: string;
                 };
             };
             TrackingNumber?: string; // Tracking number to track
             InquiryNumber?: string; // Can be used instead of TrackingNumber for some cases
             // ... other parameters like carrier code, options
         };
     }


    // Response DTOs
    export interface UPSRateResponseDto {
        RateResponse: {
            Response?: {
                 TransactionReference?: {
                    CustomerTransactionId: string;
                };
                 ResponseStatus: {
                     Code: string; // e.g., "1" for success
                     Description: string;
                 };
                 Alert?: { // Warnings or non-critical messages
                     Code: string;
                     Description: string;
                 }[];
            };
            RatedShipment: UPSRatedShipmentDto[]; // Array of rate options
             // ... other response data
        };
    }

    export interface UPSRatedShipmentDto {
         Service?: UPSServiceDto; // Service details
         RatedPackage?: UPSRatedPackageDto[]; // Details per package (often not needed for total)
         NegotiatedRateCharges?: { // Negotiated rate details
             TotalCharge: UPSChargeDto; // Total negotiated charge
              TotalChargesWithTaxes?: UPSChargeDto; // Total charge including taxes
             // ... other details
         };
         TotalCharges?: UPSChargeDto; // Total list charge
         // ... estimated delivery info (Guaranteed Delivery, etc.)
         GuaranteedDelivery?: {
             BusinessDaysInTransit?: string; // Number of business days
             DeliveryByDate?: string; // YYYYMMDD
             DeliveryByTime?: string; // HHMMSS
         };
         BillingWeight?: UPSWeightDto; // Billable weight for the shipment
          // ... other details
    }

     export interface UPSRatedPackageDto {
         TotalCharges?: UPSChargeDto;
         Weight?: string;
         BillingWeight?: UPSWeightDto;
     }

     export interface UPSLabelResponseDto {
         ShipmentResponse: {
            Response?: {
                 TransactionReference?: {
                    CustomerTransactionId: string;
                };
                 ResponseStatus: {
                     Code: string; // e.g., "1" for success
                     Description: string;
                 };
                 Alert?: { // Warnings or non-critical messages
                     Code: string;
                     Description: string;
                 }[];
            };
             ShipmentResults?: {
                 ShipmentIdentificationNumber?: string; // The generated tracking number
                 PackageResults?: { // Results per package
                     TrackingNumber?: string; // Tracking number for this package
                     ShippingLabel?: { // Label data
                         ImageFormat: { Code: string; Description: string }; // e.g., "PDF"
                         GraphicImage?: string; // Base64 encoded label image
                         // ... other label properties
                     };
                      // ... other package details
                 }[];
                 // ... other shipment details (e.g., billing weight, charges)
                 ShipmentCharges?: {
                     TotalCharges: UPSChargeDto;
                     // ... other charges
                 };
             };
             // ... other response data
         };
     }

     export interface UPSTrackingResponseDto {
         TrackResponse: {
             Response?: {
                  TransactionReference?: {
                    CustomerTransactionId: string;
                };
                 ResponseStatus: {
                     Code: string; // e.g., "1" for success
                     Description: string;
                 };
                 Alert?: { // Warnings or non-critical messages
                     Code: string;
                     Description: string;
                 }[];
             };
             Shipment?: UPSTrackingShipmentDto[]; // Array of shipments (usually 1 for a tracking number)
         };
     }

     export interface UPSTrackingShipmentDto {
         TrackingNumber?: string;
         Service?: UPSServiceDto; // Service used
         PickupDate?: string; // YYYYMMDD
         EstimatedDeliveryDate?: string; // YYYYMMDD (Predicted)
         EstimatedDeliveryTime?: string; // HHMMSS (Predicted)
         DeliveryDate?: string; // YYYYMMDD (Actual)
         DeliveryTime?: string; // HHMMSS (Actual)
         ShipmentPhase?: { Code: string; Description: string }; // Current status phrase (e.g., "In Transit", "Delivered")
         Activity?: UPSTrackingActivityDto[]; // History of events
         OriginAddress?: UPSAddressDto;
         DestinationAddress?: UPSAddressDto;
         // ... other shipment details
     }

     export interface UPSTrackingActivityDto {
         Status: { Type: string; Description: string; Code?: string; }; // Status details
         Location?: {
            Address?: UPSAddressDto;
            // ... other location details (signed for by, etc.)
            SignedForByName?: string; // Appears here in some responses
         };
         Date: string; // YYYYMMDD
         Time: string; // HHMMSS
         // ... other activity details
     }


    // Common DTOs used in requests/responses
    export interface UPSAddressDto {
        AddressLine: string[];
        City: string;
        StateProvinceCode: string;
        PostalCode: string;
        CountryCode: string;
        // ... residential indicator or type
        ResidentialAddressIndicator?: string; // Present or absent, or '1'
    }

    export interface UPSShipperDto {
        Name?: string;
        AttentionName?: string;
        ShipperNumber: string; // UPS Account Number
        Address: UPSAddressDto;
        // ... phone, email, etc.
    }

    // ShipTo/ShipFrom are similar to Shipper but without account number
    export interface UPSShipToDto {
        Name?: string;
        AttentionName?: string;
        Address: UPSAddressDto;
         // ... phone, email, etc.
    }

     export interface UPSShipFromDto {
        Name?: string;
        AttentionName?: string;
        Address: UPSAddressDto;
         // ... phone, email, etc.
    }


    export interface UPSPackageDto {
        PackagingType?: { Code: string; Description: string }; // e.g., "02" for Customer Supplied
        Dimensions?: UPSDimensionsDto;
        PackageWeight?: UPSWeightDto;
         // ... insured value, reference numbers, etc.
         Description?: string; // Can map line item names here
         PackageServiceOptions?: { // Options like COD, Declared Value
             DeclaredValue?: {
                 Type?: string; // e.g., "01" for Actual Value
                 CurrencyCode: string;
                 MonetaryValue: string; // string representation of number
             };
         };
    }

    export interface UPSDimensionsDto {
        UnitOfMeasurement: { Code: string; Description?: string }; // e.g., "IN", "CM"
        Length: string; // string representation of number
        Width: string; // string representation of number
        Height: string; // string representation of number
    }

    export interface UPSWeightDto {
        UnitOfMeasurement: { Code: string; Description?: string }; // e.g., "LBS", "KGS"
        Weight: string; // string representation of number
    }

     export interface UPSServiceDto {
        Code: string; // e.g., "03" for UPS Ground
        Description?: string;
     }

     export interface UPSChargeDto {
         CurrencyCode: string;
         MonetaryValue: string; // string representation of number
     }

     export interface UPSPaymentInformationDto {
        ShipmentCharge: {
            Type: string; // e.g., "01" for Transportation Charges
            BillShipper?: { // If shipper pays
                AccountNumber: string; // UPS Account Number
            };
            // ... other billing options (consignee, third party)
        };
        // ... other payment types (e.g., DutiesAndTaxes)
     }

     export interface UPSLabelSpecificationDto {
        LabelImageFormat: { Code: string; Description?: string }; // e.g., "PDF", "ZPL"
        LabelStockSetting?: { Type: string; Description?: string }; // e.g., "01" for 4x6, "04" for 8.5x11
         // ... other label options
     }
}