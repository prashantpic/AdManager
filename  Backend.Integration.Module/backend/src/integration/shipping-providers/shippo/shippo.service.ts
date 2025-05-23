import { Injectable, Logger } from '@nestjs/common';
// Correct way to import shippo SDK
// npm install shippo --save
// import shippo from 'shippo'; // CommonJS style
import * as ShippoSDK from 'shippo'; // ES Module style if SDK supports it, or use require
const shippo = require('shippo');


import { ShippoApiConfig } from './shippo.config';
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import { IntegrationException, ExternalServiceAuthenticationException } from '../../common/exceptions';

// Define interfaces for DTOs based on Shippo's API
// e.g., ShipmentDetailsDto, Rate, Transaction, TrackingStatus
// For this example, using 'any' where complex DTOs would be.
// export interface ShippoShipmentDetailsDto { ... }
// export interface ShippoRateDto { ... }
// export interface ShippoLabelDto { ... }
// export interface ShippoTrackingStatusDto { ... }


@Injectable()
export class ShippoService {
  private readonly logger = new Logger(ShippoService.name);
  private shippoClient: ShippoSDK.Shippo;

  constructor(private readonly shippoApiConfig: ShippoApiConfig) {
    if (!this.shippoApiConfig.apiKey) {
      this.logger.error('Shippo API key is not configured.');
      throw new ExternalServiceAuthenticationException(ExternalServiceId.SHIPPO.toString(), 'Shippo API key missing.');
    }
    this.shippoClient = shippo(this.shippoApiConfig.apiKey);
  }

  async getRates(shipmentDetails: any): Promise<ShippoSDK.Rate[]> {
    // shipmentDetails should conform to Shippo's shipment creation request object
    // See: https://goshippo.com/docs/reference/bash#shipments-create
    // It typically includes address_from, address_to, parcels, etc.
    try {
      this.logger.log('Fetching shipping rates from Shippo.');
      // Shippo's rate retrieval is often part of shipment creation or a separate rate call
      // Create a shipment object first to get rates
      const shipment = await this.shippoClient.shipment.create(shipmentDetails);

      if (shipment.rates && shipment.rates.length > 0) {
        // Filter or sort rates as needed
        return shipment.rates as ShippoSDK.Rate[];
      } else if (shipment.messages && shipment.messages.length > 0) {
         this.logger.warn(`Shippo messages while fetching rates: ${JSON.stringify(shipment.messages)}`);
         // Depending on messages, might be an error or just info
         if (shipment.status === 'ERROR') {
            throw new IntegrationException(`Shippo error fetching rates: ${JSON.stringify(shipment.messages)}`, ExternalServiceId.SHIPPO.toString());
         }
      }
      return []; // No rates found or an issue not throwing an error
    } catch (error) {
      this.handleShippoError(error, 'getRates');
    }
  }

  async createLabel(transactionRateId: string): Promise<ShippoSDK.Transaction> {
    // transactionRateId is the object_id of the chosen rate from getRates response
    try {
      this.logger.log(`Creating shipping label from Shippo for rate: ${transactionRateId}`);
      const transaction = await this.shippoClient.transaction.create({
        rate: transactionRateId,
        label_file_type: "PDF", // Or ZPLII, PNG
        async: false, // Set to true for asynchronous label generation
      });

      // If async is true, you'd poll transaction.object_id for status
      // If async is false, transaction object should contain label_url and tracking_number
      if (transaction.status === 'SUCCESS') {
        return transaction as ShippoSDK.Transaction;
      } else if (transaction.status === 'ERROR' || (transaction.messages && transaction.messages.length > 0)) {
        this.logger.error(`Shippo label creation error/messages: ${JSON.stringify(transaction.messages)}`);
        throw new IntegrationException(
            `Shippo label creation failed: ${JSON.stringify(transaction.messages)}`,
            ExternalServiceId.SHIPPO.toString(),
            undefined,
            transaction.messages
        );
      }
      throw new IntegrationException('Shippo label creation did not return SUCCESS status without explicit error messages.', ExternalServiceId.SHIPPO.toString());
    } catch (error) {
      this.handleShippoError(error, 'createLabel');
    }
  }

  async trackShipment(carrier: string, trackingNumber: string): Promise<ShippoSDK.TrackingStatus> {
    try {
      this.logger.log(`Tracking shipment from Shippo. Carrier: ${carrier}, Tracking #: ${trackingNumber}`);
      // Shippo's tracking endpoint:
      // Alternatively, use shippoClient.track.get_status(carrier, trackingNumber) if SDK has it
      // Or shippoClient.track.create({ carrier, tracking_number }) to register for webhooks
      const trackingStatus = await this.shippoClient.track.get_status(carrier, trackingNumber);
      return trackingStatus as ShippoSDK.TrackingStatus;
    } catch (error) {
      this.handleShippoError(error, 'trackShipment');
    }
  }

  private handleShippoError(error: any, operation: string): never {
    this.logger.error(`Shippo API error during ${operation}: ${error.message || error}`, error.stack || error);
    // Shippo SDK might throw errors with status and detail
    // Or it might return objects with a 'status: "ERROR"' and 'messages' array
    if (error.detail) { // Often error is { detail: 'Error message', status: 400 }
        throw new IntegrationException(
            `Shippo API error during ${operation}: ${error.detail}`,
            ExternalServiceId.SHIPPO.toString(),
            error.status,
            error
        );
    }
    if (error instanceof IntegrationException) {
        throw error;
    }
    throw new IntegrationException(
      `Shippo API error during ${operation}: ${error.message || 'Unknown Shippo error'}`,
      ExternalServiceId.SHIPPO.toString(),
      undefined, // Status code might not be readily available for all SDK errors
      error
    );
  }
}