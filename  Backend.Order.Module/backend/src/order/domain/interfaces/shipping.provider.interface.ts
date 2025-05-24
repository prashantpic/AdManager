import { ShippingAddressDto, OrderItemDto as RequestOrderItemDto } from "../../../application/dtos/create-order.dto";

// Data structure for items passed to the shipping provider
export interface ShippingItemContext {
    productId: string;
    quantity: number;
    // Potentially: unitPrice: number; weight: number; dimensions: {l,w,h};
}

// Context required by the shipping provider to calculate rates/options
export interface ShippingCalculationRequest {
    merchantId: string;
    items: ShippingItemContext[];
    destinationAddress: ShippingAddressDto;
    originAddress?: ShippingAddressDto; // Optional, might be configured per merchant
    currency?: string; // For cost display
    // Other factors: preferred_carrier, service_level, package_type
}

// Represents a single shipping option returned by the provider
export interface ShippingOption {
    id: string; // Unique identifier for this shipping rate/option (e.g., carrier_service_level)
    name: string; // User-friendly name (e.g., "Standard Ground", "Express Overnight")
    description?: string; // More details about the service
    cost: number; // The calculated cost for this shipping option
    currency: string; // ISO currency code of the cost
    estimatedDeliveryDaysMin?: number;
    estimatedDeliveryDaysMax?: number;
    estimatedDeliveryDate?: Date; // Specific estimated delivery date if available
    carrier?: string; // Name of the shipping carrier
    // Any other relevant details
}

export const IShippingProvider = Symbol('IShippingProvider');

export interface IShippingProvider {
  /**
   * Retrieves available shipping options and their costs for a given order context.
   * @param request Contextual information about the order items and destination.
   * @returns A Promise resolving to an array of ShippingOption. Returns an empty array if no options are available.
   * @throws ShippingCalculationException or specific exceptions on failure.
   */
  getShippingOptions(request: ShippingCalculationRequest): Promise<ShippingOption[]>;

  // Other potential methods:
  // createShipment(orderId: string, selectedShippingOptionId: string): Promise<ShipmentConfirmation>;
  // getTrackingInfo(trackingNumber: string): Promise<TrackingDetails>;
  // validateAddress(address: ShippingAddressDto): Promise<AddressValidationResult>;
}