export class BillingDetailsVO {
  public readonly paymentMethodToken: string; // Token from payment gateway
  public readonly address: string; // Billing address (can be a complex object/VO itself)
  public readonly contactEmail: string;

  constructor(paymentMethodToken: string, address: string, contactEmail: string) {
    if (!paymentMethodToken || paymentMethodToken.trim() === '') {
      throw new Error('Payment method token cannot be empty.');
    }
    if (!contactEmail || contactEmail.trim() === '') { // Basic email validation could be added
      throw new Error('Contact email cannot be empty.');
    }
    // Address validation could be more complex if it's a structured object
    this.paymentMethodToken = paymentMethodToken;
    this.address = address;
    this.contactEmail = contactEmail;
    Object.freeze(this); // Make immutable
  }

  public equals(other?: BillingDetailsVO): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor.name !== this.constructor.name) {
        return false;
    }
    // Address equality can be complex; for simple string, direct comparison is fine.
    // If address becomes a VO, delegate equality.
    return (
      this.paymentMethodToken === other.paymentMethodToken &&
      this.address === other.address &&
      this.contactEmail === other.contactEmail
    );
  }
}