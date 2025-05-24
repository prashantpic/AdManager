import { HttpException, HttpStatus } from '@nestjs/common';
import { CarrierCode } from '../../core/enums/carrier-code.enum'; // Assuming this enum exists

/**
 * Base class for shipping-related errors.
 */
export class ShippingError extends HttpException {
  constructor(message: string, statusCode: HttpStatus, public readonly code?: string) {
    super(message, statusCode);
    this.name = this.constructor.name; // Set the error name
  }
}

/**
 * Error thrown when shipping rates cannot be calculated for a shipment.
 */
export class ShippingRateUnavailableError extends ShippingError {
  constructor(message = 'Shipping rates are currently unavailable for this shipment.') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'SHIPPING_RATE_UNAVAILABLE');
  }
}

/**
 * Error thrown when a specific carrier provider fails to return rates.
 */
export class CarrierRateError extends ShippingError {
  constructor(public readonly carrier: CarrierCode, originalError?: any) {
    const message = `Failed to get rates from ${carrier}.`;
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'CARRIER_RATE_ERROR');
    if (originalError && originalError.stack) {
        this.stack = originalError.stack;
    }
    if (originalError && originalError.message && originalError.message !== message) {
        this.message = `${message} Original error: ${originalError.message}`;
    }
  }
}

/**
 * Error thrown when label generation fails.
 */
export class LabelGenerationFailedError extends ShippingError {
  constructor(message = 'Failed to generate shipping label.') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'LABEL_GENERATION_FAILED');
  }
}

/**
 * Error thrown when tracking information cannot be retrieved.
 */
export class TrackingInfoUnavailableError extends ShippingError {
  constructor(message = 'Tracking information is currently unavailable.') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'TRACKING_INFO_UNAVAILABLE');
  }
}

/**
 * Error thrown when an invalid shipping address is provided.
 */
export class InvalidShippingAddressError extends ShippingError {
  constructor(message = 'Invalid or incomplete shipping address.') {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_ADDRESS');
  }
}

/**
 * Error thrown when a requested operation is not supported by the provider.
 */
export class OperationNotSupportedError extends ShippingError {
  constructor(operation: string, provider: CarrierCode) {
    const message = `Operation "${operation}" is not supported by provider "${provider}".`;
    super(message, HttpStatus.NOT_IMPLEMENTED, 'OPERATION_NOT_SUPPORTED');
  }
}

/**
 * Error thrown when a required configuration for a provider is missing or invalid.
 */
export class ProviderConfigurationError extends ShippingError {
  constructor(public readonly provider: CarrierCode, public readonly configKey: string, message?: string) {
    const defaultMessage = `Missing or invalid configuration for provider ${provider}: ${configKey}.`;
    super(message || defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR, 'PROVIDER_CONFIGURATION_ERROR');
  }
}

/**
 * Error thrown when a shipping rule is not found.
 */
export class ShippingRuleNotFoundError extends ShippingError {
  constructor(ruleId: string) {
    const message = `Shipping rule with ID "${ruleId}" not found.`;
    super(message, HttpStatus.NOT_FOUND, 'SHIPPING_RULE_NOT_FOUND');
  }
}

/**
 * Error thrown when a selected rate for label generation is not found or invalid.
 */
export class SelectedRateInvalidError extends ShippingError {
  constructor(selectedRateId: string, reason?: string) {
    const message = `Selected rate ID "${selectedRateId}" is invalid or cannot be used. ${reason || ''}`.trim();
    super(message, HttpStatus.BAD_REQUEST, 'SELECTED_RATE_INVALID');
  }
}