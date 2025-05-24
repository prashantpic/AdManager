// This file would contain interfaces/types mirroring the Shippo API request/response structures.
// Shippo is a multi-carrier API, so its structures are more generic but still Shippo-specific.
// Example (simplified):

export namespace ShippoApiDtos {
    // Request DTOs
    export interface ShippoShipmentCreateRequestDto {
        address_from: ShippoAddressDto;
        address_to: ShippoAddressDto;
        parcels: ShippoParcelDto[];
        // ... other shipment details like submission_type, insurance, metadata
         async?: boolean; // Request asynchronous rate calculation (webhook)
         carrier_accounts?: string[]; // Specify which carrier accounts to use
         metadata?: string;
    }

    // Shippo rate response is part of the Shipment object response
    export interface ShippoShipmentResponseDto {
         object_state?: string; // 'VALID', 'INVALID', 'QUEUED', 'WAITING_FOR_RATES'
         object_status?: string; // 'SUCCESS', 'ERROR', 'VALIDATING', 'VALIDATED'
         rates?: ShippoRateDto[]; // Array of available rates
         messages?: ShippoMessageDto[]; // Error/warning messages
         // ... other shipment properties (addresses, parcels, etc.)
          object_id?: string; // Shippo's ID for this shipment object
          // ... other properties
    }


    export interface ShippoTransactionCreateRequestDto {
        rate: string; // The object_id of the selected rate object
        label_file_type?: string; // e.g., 'PDF', 'PNG', 'ZPLII'
         // ... other transaction options like customs_declaration, metadata
    }

     export interface ShippoTransactionResponseDto {
         object_state?: string; // 'VALIDATING', 'VALID', 'INVALID'
         object_status?: string; // 'QUEUED', 'WAITING', 'SUCCESS', 'ERROR'
         object_id?: string; // Shippo's ID for this transaction object
         tracking_number?: string; // The generated tracking number
         label_url?: string; // URL to fetch the label image
         label_file_type?: string; // e.g., 'PDF'
         commercial_invoice_url?: string; // For international shipments
         messages?: ShippoMessageDto[]; // Error/warning messages
         original_carrier?: string; // The actual carrier used (e.g., 'fedex')
          // ... other properties
     }


     export interface ShippoTrackingResponseDto {
         object_id?: string; // Shippo's ID for this tracking object
         tracking_number?: string;
         carrier?: string; // Shippo carrier code (e.g., 'usps', 'fedex')
         tracking_status?: ShippoTrackingStatusDto; // Current status
         past_statuses?: ShippoTrackingStatusDto[]; // History (often duplicates tracking_history but simpler)
         tracking_history?: ShippoTrackingEventDto[]; // Detailed history
         eta?: string; // Estimated delivery date (YYYY-MM-DDTHH:MM:SSZ)
         original_carrier?: string; // Original carrier code if different
         original_carrier_tracking_number?: string; // Original tracking number if different
         messages?: ShippoMessageDto[];
          // ... other properties
     }

    export interface ShippoTrackingStatusDto {
         status?: string; // e.g., 'TRANSIT', 'DELIVERED', 'FAILURE', 'RETURNED'
         status_details?: string; // Detailed description
         status_date?: string; // ISO 8601 timestamp
         location?: ShippoLocationDto;
          // ... other properties
    }

    export interface ShippoTrackingEventDto {
         object_created?: string; // Timestamp (ISO 8601)
         object_id?: string;
         object_status?: string; // Same as status in ShippoTrackingStatusDto
         object_state?: string; // 'VALID', 'INVALID'
         location?: ShippoLocationDto;
         status_details?: string; // Detailed description
         signature?: { name?: string };
         // ... other properties (e.g., signature)
    }


    // Common DTOs used in requests/responses
    export interface ShippoAddressDto {
        name?: string;
        company?: string;
        street1: string;
        street2?: string;
        city: string;
        state: string; // State code
        zip: string; // Postal code
        country: string; // ISO 2 letter country code
        phone?: string;
        email?: string;
        is_residential?: boolean; // boolean true/false
         // ... other properties
    }

    export interface ShippoParcelDto {
        length: string; // string representation of number
        width: string; // string representation of number
        height: string; // string representation of number
        distance_unit: string; // e.g., 'cm', 'in'
        weight: string; // string representation of number
        mass_unit: string; // e.g., 'kg', 'lb'
         metadata?: string;
         // ... other properties like description, amount, currency, object_template
    }

     export interface ShippoRateDto {
         object_id?: string; // Unique ID for this rate quote
         provider?: string; // Shippo internal carrier code (e.g., 'usps', 'fedex', 'dhl_express')
         provider_image_75?: string; // Carrier logo URL
         servicelevel?: {
             token?: string; // Service level token (e.g., 'usps_priority')
             name?: string; // Service level name (e.g., 'Priority Mail')
              // ... other properties
         };
         amount?: string; // string representation of cost
         currency?: string;
         estimated_days?: number; // Estimated transit days
         estimated_delivery_date?: string; // YYYY-MM-DDTHH:MM:SSZ
          messages?: ShippoMessageDto[]; // Messages specific to this rate
          // ... other rate properties (zone, carrier_account, etc.)
     }

    export interface ShippoMessageDto {
        code?: string;
        text?: string;
        type?: string; // e.g., 'WARNING', 'ERROR'
         // ... other properties
    }

     export interface ShippoLocationDto {
         city?: string;
         state?: string; // State code
         zip?: string; // Postal code
         country?: string; // ISO 2 letter country code
          // ... other properties like location_type, latitude, longitude
     }
}