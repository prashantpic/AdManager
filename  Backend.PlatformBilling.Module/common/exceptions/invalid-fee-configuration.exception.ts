import { BillingProcessException } from './billing-process.exception';

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.Common.Exceptions
 */
export class InvalidFeeConfigurationException extends BillingProcessException {
  constructor(message: string = 'Invalid or inconsistent fee configuration encountered.') {
    super(message);
    this.name = 'InvalidFeeConfigurationException';
  }
}