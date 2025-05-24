import { Injectable, Logger } from '@nestjs/common';
import { IShippingProvider } from '../../core/interfaces/shipping-provider.interface';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { MerchantConfigModel } from '../../core/models/merchant-config.model';
import { ShippoMapper } from './shippo.mapper'; // Assumed to exist
import { HttpClientService } from '@admanager/backend.core.module'; // Assumed to exist
import { ShippingConfigService } from '../../config/shipping-config.service'; // Assumed to exist
import { ShippoApiDtos } from './dto/shippo-api.dtos'; // Assumed to exist
import {
  CarrierRateError,
  LabelGenerationFailedError,
  ProviderConfigurationError,
  TrackingInfoUnavailableError,
} from '../../common/errors/shipping.errors'; // Assumed to exist

@Injectable()
export class ShippoShippingProvider implements IShippingProvider {
  private readonly logger = new Logger(ShippoShippingProvider.name);
  private apiUrl: string;
  private timeout: number;

  constructor(
    private shippoMapper: ShippoMapper,
    private httpClient: HttpClientService,
    private configService: ShippingConfigService,
  ) {
    this.apiUrl = this.configService.getProviderApiUrl(CarrierCode.SHIPPO) || 'https://api.goshippo.com'; // Shippo API URL
    this.timeout = this.configService.getProviderTimeout(CarrierCode.SHIPPO);
  }

  getProviderCode(): CarrierCode {
    return CarrierCode.SHIPPO;
  }

  async getRates(
    shipmentDetails: ShipmentDetailsModel,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingRateQuoteModel[]> {
    this.logger.debug(`Shippo: Fetching rates for merchant ${merchantConfig.merchantId}`);
    try {
      const apiKey = await this.getCredentials(merchantConfig);
      const shippoCarrierAccountIds: string[] | undefined = merchantConfig.customProperties?.shippoCarrierAccountIds;
      
      const shippoRequest = this.shippoMapper.toShippoShipmentCreateRequest(shipmentDetails, shippoCarrierAccountIds);
      const url = `${this.apiUrl}/shipments/`;

      const response = await this.httpClient.post<ShippoApiDtos.ShippoShipmentResponseDto>(url, shippoRequest, {
        headers: { 'Authorization': `ShippoToken ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });

      if (response.status !== 201 || response.data?.object_status === 'ERROR' || !response.data?.rates) {
        this.logger.error(`Shippo Rate API error: Status ${response.status}, Shippo Status: ${response.data?.object_status}`, response.data?.messages);
        throw new CarrierRateError(CarrierCode.SHIPPO, response.data?.messages);
      }
      return this.shippoMapper.fromShippoRateResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'getRates', CarrierCode.SHIPPO);
    }
  }

  async createLabel(
    shipmentDetails: ShipmentDetailsModel, // Not directly used if rate ID is sufficient
    selectedRateId: string, // This must be the Shippo Rate object_id
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingLabelModel> {
    this.logger.debug(`Shippo: Creating label for merchant ${merchantConfig.merchantId}, rate ID ${selectedRateId}`);
    try {
      const apiKey = await this.getCredentials(merchantConfig);
      const selectedRateObject = { id: selectedRateId, carrierCode: CarrierCode.SHIPPO } as ShippingRateQuoteModel; // Minimal object
      
      const shippoRequest = this.shippoMapper.toShippoTransactionCreateRequest(selectedRateObject);
      const url = `${this.apiUrl}/transactions/`;

      const response = await this.httpClient.post<ShippoApiDtos.ShippoTransactionResponseDto>(url, shippoRequest, {
        headers: { 'Authorization': `ShippoToken ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });

      if (response.status !== 201 || response.data?.object_status === 'ERROR' || response.data?.object_status !== 'SUCCESS') {
        this.logger.error(`Shippo Label API error: Status ${response.status}, Shippo Status: ${response.data?.object_status}`, response.data?.messages);
        throw new LabelGenerationFailedError(`Shippo label transaction failed or not completed: ${response.data?.object_status}`);
      }
      return this.shippoMapper.fromShippoTransactionResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'createLabel', CarrierCode.SHIPPO);
    }
  }

  async getTrackingDetails(
    trackingNumber: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<TrackingDetailsModel> {
    this.logger.debug(`Shippo: Getting tracking for ${trackingNumber}, merchant ${merchantConfig.merchantId}`);
    try {
      const apiKey = await this.getCredentials(merchantConfig);
      const shippoCarrierCode = merchantConfig.customProperties?.shippoCarrierCodeHint || 'auto'; // Use hint or auto-detect
      
      const url = `${this.apiUrl}/tracks/${shippoCarrierCode}/${trackingNumber}`;
      
      const response = await this.httpClient.get<ShippoApiDtos.ShippoTrackingResponseDto>(url, {
        headers: { 'Authorization': `ShippoToken ${apiKey}` },
        timeout: this.timeout,
      });

      if (response.status !== 200 || !response.data?.tracking_number) {
        this.logger.error(`Shippo Tracking API error: Status ${response.status}`, response.data?.messages);
        throw new TrackingInfoUnavailableError('Shippo tracking info unavailable.');
      }
      const trackingDetails = this.shippoMapper.fromShippoTrackingResponse(response.data);
      if (!trackingDetails) throw new TrackingInfoUnavailableError('No Shippo tracking details mapped.');
      return trackingDetails;
    } catch (error) {
      this.handleProviderError(error, 'getTrackingDetails', CarrierCode.SHIPPO);
    }
  }

  private async getCredentials(merchantConfig: MerchantConfigModel): Promise<string> {
    if (!merchantConfig.credentialsRef) {
      throw new ProviderConfigurationError(CarrierCode.SHIPPO, 'credentialsRef missing for Shippo API Key');
    }
    const apiKey = await this.configService.getSecret(merchantConfig.credentialsRef);
    if (!apiKey) {
      throw new ProviderConfigurationError(CarrierCode.SHIPPO, 'Shippo API Key not found');
    }
    return apiKey;
  }

  private handleProviderError(error: any, operation: string, carrier: CarrierCode): never {
    if (error instanceof ProviderConfigurationError || error instanceof CarrierRateError || error instanceof LabelGenerationFailedError || error instanceof TrackingInfoUnavailableError) {
      throw error;
    }
    this.logger.error(`Shippo ${operation} failed: ${error.message}`, error.stack);
    if (operation === 'getRates') throw new CarrierRateError(carrier, error);
    if (operation === 'createLabel') throw new LabelGenerationFailedError(`Shippo: ${error.message}`);
    if (operation === 'getTrackingDetails') throw new TrackingInfoUnavailableError(`Shippo: ${error.message}`);
    throw new Error(`Shippo: Unknown error during ${operation}: ${error.message}`);
  }
}