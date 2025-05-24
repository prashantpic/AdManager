export class PaymentProcessingException extends Error {
    constructor(message: string, public readonly originalError?: any, public readonly gatewayResponse?: any) {
        super(message);
        this.name = 'PaymentProcessingException';
    }
}

export class PaymentGatewayIntegrationException extends PaymentProcessingException {
     constructor(public readonly gateway: string, message: string, gatewayError?: any, originalError?: any) {
         super(`Gateway integration error with ${gateway}: ${message}`, originalError, gatewayError);
         this.name = 'PaymentGatewayIntegrationException';
     }
}

export class InvalidPaymentDetailsException extends PaymentProcessingException {
    constructor(message: string, originalError?: any, gatewayResponse?: any) {
        super(`Invalid payment details: ${message}`, originalError, gatewayResponse);
        this.name = 'InvalidPaymentDetailsException';
    }
}

export class RefundProcessingException extends PaymentProcessingException {
     constructor(message: string, originalError?: any, gatewayResponse?: any) {
         super(`Refund processing error: ${message}`, originalError, gatewayResponse);
         this.name = 'RefundProcessingException';
     }
}


export class RecurringPaymentException extends Error {
    constructor(message: string, public readonly originalError?: any, public readonly gatewayResponse?: any) {
        super(message);
        this.name = 'RecurringPaymentException';
    }
}

export class SubscriptionManagementErrorException extends RecurringPaymentException {
    constructor(public readonly gateway: string, message: string, gatewayError?: any, originalError?: any) {
        super(`Subscription management error with ${gateway}: ${message}`, originalError, gatewayError);
        this.name = 'SubscriptionManagementErrorException';
    }
}

export class DunningProcessException extends RecurringPaymentException {
    constructor(message: string, originalError?: any) {
        super(`Dunning process failed: ${message}`, originalError);
        this.name = 'DunningProcessException';
    }
}

export class WebhookVerificationException extends Error {
    constructor(public readonly gateway: string, message: string = 'Webhook signature verification failed.') {
        super(`Webhook verification error for ${gateway}: ${message}`);
        this.name = 'WebhookVerificationException';
    }
}

export class UnsupportedGatewayException extends Error {
    constructor(public readonly gateway: string, message: string = 'Gateway not supported or enabled.') {
        super(`Unsupported gateway: ${gateway}. ${message}`);
        this.name = 'UnsupportedGatewayException';
    }
}