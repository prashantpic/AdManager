import { CustomerDetailsDto, ShippingAddressDto } from '../../../application/dtos/create-order.dto'; // Reusing DTOs for structure definition

export interface SavedAddress {
    id: string;
    isDefault?: boolean;
    address: ShippingAddressDto; // Using DTO for structure
}

export interface SavedPaymentMethod {
    id: string;
    isDefault?: boolean;
    type: string; // e.g., 'card', 'paypal'
    details: any; // e.g., last4, expiry for card; email for paypal
}

export interface SavedCustomerProfile {
    customerId: string; // Matches userId
    email: string;
    firstName?: string;
    lastName?: string;
    savedAddresses: SavedAddress[];
    savedPaymentMethods: SavedPaymentMethod[];
    // other preferences like default currency, etc.
}

export const ICustomerDataProvider = Symbol('ICustomerDataProvider');

export interface ICustomerDataProvider {
  /**
   * Retrieves saved customer profile details, including default or specified
   * shipping addresses and payment methods for a given user.
   * @param userId The ID of the authenticated user.
   * @returns A Promise resolving to the SavedCustomerProfile or null if not found or an error occurs.
   */
  getSavedCustomerDetails(userId: string): Promise<SavedCustomerProfile | null>;
}