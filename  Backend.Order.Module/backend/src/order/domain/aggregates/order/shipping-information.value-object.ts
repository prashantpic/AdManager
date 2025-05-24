export interface ShippingAddressData {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

/**
 * Value Object for Shipping Address.
 */
export class ShippingAddressValueObject {
    public readonly street: string;
    public readonly city: string;
    public readonly state?: string;
    public readonly postalCode: string;
    public readonly country: string;

    constructor(data: ShippingAddressData) {
        if (!data.street || !data.city || !data.postalCode || !data.country) {
            throw new Error('Street, city, postal code, and country are required for shipping address.'); // Consider specific DomainException
        }
        this.street = data.street;
        this.city = data.city;
        this.state = data.state;
        this.postalCode = data.postalCode;
        this.country = data.country;
    }

    public equals(other?: ShippingAddressValueObject): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return (
            this.street === other.street &&
            this.city === other.city &&
            this.state === other.state &&
            this.postalCode === other.postalCode &&
            this.country === other.country
        );
    }
}

export interface ShippingInformationData {
    address: ShippingAddressData;
    method: string; // e.g., 'Standard', 'Express'
    cost: number;
}

/**
 * Value object for shipping information of an order.
 * An immutable data structure representing how and where an order is to be shipped.
 */
export class ShippingInformation {
    public readonly address: ShippingAddressValueObject;
    public readonly method: string;
    public readonly cost: number;

    constructor(addressData: ShippingAddressData, method: string, cost: number) {
        this.address = new ShippingAddressValueObject(addressData);
        if (!method) {
            throw new Error('Shipping method is required.'); // Consider specific DomainException
        }
        this.method = method;
        if (cost < 0) {
            throw new Error('Shipping cost cannot be negative.'); // Consider specific DomainException
        }
        this.cost = cost;
    }

    public equals(other?: ShippingInformation): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return (
            this.address.equals(other.address) &&
            this.method === other.method &&
            this.cost === other.cost
        );
    }
}