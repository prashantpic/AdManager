export class BillingProcessException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillingProcessException';
  }
}