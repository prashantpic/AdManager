export interface CustomerInformationData {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

/**
 * Value object for customer information related to an order.
 * An immutable data structure representing customer contact details for an order.
 */
export class CustomerInformation {
    public readonly email: string;
    public readonly firstName?: string;
    public readonly lastName?: string;
    public readonly phone?: string;

    constructor(data: CustomerInformationData) {
        if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) { // Basic email validation
            throw new Error('A valid customer email is required.'); // Consider specific DomainException
        }
        this.email = data.email;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.phone = data.phone;
    }

    public equals(other?: CustomerInformation): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        if (other.constructor.name !== this.constructor.name) {
            return false;
        }
        return (
            this.email === other.email &&
            this.firstName === other.firstName &&
            this.lastName === other.lastName &&
            this.phone === other.phone
        );
    }
}