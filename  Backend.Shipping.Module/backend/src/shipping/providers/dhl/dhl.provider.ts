import { Injectable, Logger } from '@nestjs/common';
import { IShippingProvider } from '../../core/interfaces/shipping-provider.interface';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { MerchantConfigModel } from '../../core/models/merchant-config.model';
import { DHLMapper } from './dhl.mapper'; // Assumed to exist
import { HttpClientService } from '@admanager/backend.core.module'; // Assumed to exist
import { ShippingConfigService } from '../../config/shipping-config.service'; // Assumed to exist
import { DHLApiDtos } from './dto/dhl-api.dtos'; // Assumed to exist
import {
  CarrierRateError,
  LabelGenerationFailedError,
  ProviderConfigurationError,
  TrackingInfoUnavailableError,
} from '../../common/errors/shipping.errors'; // Assumed to exist

@Injectable()
export class DHLShippingProvider implements IShippingProvider {
  private readonly logger = new Logger(DHLShippingProvider.name);
  private apiUrl: string; // e.g., for DHL Express
  private timeout: number;

  constructor(
    private dhlMapper: DHLMapper,
    private httpClient: HttpClientService,
    private configService: ShippingConfigService,
  ) {
    this.apiUrl = this.configService.getProviderApiUrl(CarrierCode.DHL) || 'https://api-mock.dhl.com/mydhlapi'; // Example URL for DHL Express
    this.timeout = this.configService.getProviderTimeout(CarrierCode.DHL);
  }

  getProviderCode(): CarrierCode {
    return CarrierCode.DHL;
  }

  async getRates(
    shipmentDetails: ShipmentDetailsModel,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingRateQuoteModel[]> {
    this.logger.debug(`DHL: Fetching rates for merchant ${merchantConfig.merchantId}`);
    try {
      const { apiKey, apiSecret, accountNumber } = await this.getCredentials(merchantConfig); // DHL uses API Key/Secret or User/Pass
      const dhlRequest = this.dhlMapper.toDHLRateRequest(shipmentDetails); // accountNumber might be in headers for DHL
      const url = `${this.apiUrl}/rates`; // Example, actual endpoint might be /mydhlapi/rates

      const response = await this.httpClient.post<DHLApiDtos.DHLRateResponseDto>(url, dhlRequest, {
        headers: { // DHL Express headers are specific
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`, // Or API Key in specific header
          'DHL-Account-Number': accountNumber, // Often required in header
        },
        timeout: this.timeout,
      });

      if (response.status !== 200 || !response.data?.GetRateResponse?.Provider?.[0]?.Service) {
        this.logger.error(`DHL Rate API error: Status ${response.status}`, response.data);
        throw new CarrierRateError(CarrierCode.DHL, response.data);
      }
      return this.dhlMapper.fromDHLRateResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'getRates', CarrierCode.DHL);
    }
  }

  async createLabel(
    shipmentDetails: ShipmentDetailsModel,
    selectedRateId: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingLabelModel> {
    this.logger.debug(`DHL: Creating label for merchant ${merchantConfig.merchantId}, rate ID ${selectedRateId}`);
    try {
      const { apiKey, apiSecret, accountNumber } = await this.getCredentials(merchantConfig);
      const selectedRateObject = { carrierCode: CarrierCode.DHL, serviceCode: 'P', originalProviderRate: {} } as ShippingRateQuoteModel; // Placeholder, P for Express Worldwide
      
      const dhlRequest = this.dhlMapper.toDHLLabelRequest(shipmentDetails, selectedRateObject, accountNumber);
      const url = `${this.apiUrl}/shipments`; // Example, actual endpoint might be /mydhlapi/shipments

      const response = await this.httpClient.post<DHLApiDtos.DHLLabelResponseDto>(url, dhlRequest, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
          'DHL-Account-Number': accountNumber,
        },
        timeout: this.timeout,
      });
      // DHL shipment creation often returns 201 Created
      if (response.status !== 201 || !response.data?.ShipmentResponse?.AirwayBillNumber || !response.data?.ShipmentResponse?.LabelImage?.[0]?.OutputImage) {
        this.logger.error(`DHL Label API error: Status ${response.status}`, response.data);
        throw new LabelGenerationFailedError('DHL label generation failed.');
      }
      return this.dhlMapper.fromDHLLabelResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'createLabel', CarrierCode.DHL);
    }
  }

  async getTrackingDetails(
    trackingNumber: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<TrackingDetailsModel> {
    this.logger.debug(`DHL: Getting tracking for ${trackingNumber}, merchant ${merchantConfig.merchantId}`);
    try {
      const { apiKey, apiSecret } = await this.getCredentials(merchantConfig); // Account number might not be needed or different for tracking API
      // DHL Tracking often uses a GET request with API Key in header
      const url = `${this.apiUrl}/track/shipments?trackingNumber=${trackingNumber}`; // Example, actual endpoint might be /mydhlapi/tracking
      
      const response = await this.httpClient.get<DHLApiDtos.DHLTrackingResponseDto>(url, {
        headers: {
          'DHL-API-Key': apiKey, // DHL specific header for API key
          // Some DHL tracking APIs might use Basic Auth or other schemes
        },
        timeout: this.timeout,
      });

      if (response.status !== 200 || !response.data?.shipments?.[0]?.trackingNumber) {
        this.logger.error(`DHL Tracking API error: Status ${response.status}`, response.data);
        throw new TrackingInfoUnavailableError('DHL tracking info unavailable.');
      }
      const trackingDetails = this.dhlMapper.fromDHLTrackingResponse(response.data);
      if (!trackingDetails) throw new TrackingInfoUnavailableError('No DHL tracking details mapped.');
      return trackingDetails;
    } catch (error) {
      this.handleProviderError(error, 'getTrackingDetails', CarrierCode.DHL);
    }
  }

  private async getCredentials(merchantConfig: MerchantConfigModel): Promise<{ apiKey: string; apiSecret: string; accountNumber: string }> {
    if (!merchantConfig.credentialsRef) {
      throw new ProviderConfigurationError(CarrierCode.DHL, 'credentialsRef missing');
    }
    // Assume credentialsRef points to a JSON secret with keys: apiKey, apiSecret
    const credsString = await this.configService.getSecret(merchantConfig.credentialsRef);
    let creds;
    try {
        creds = JSON.parse(credsString);
    } catch (e) {
        throw new ProviderConfigurationError(CarrierCode.DHL, 'Credentials JSON malformed');
    }
    
    const accountNumber = merchantConfig.accountNumber || await this.configService.getSecret(`${merchantConfig.credentialsRef}_ACCOUNT`);

    if (!creds.apiKey || !creds.apiSecret || !accountNumber) {
      throw new ProviderConfigurationError(CarrierCode.DHL, 'API Key, API Secret, or Account Number missing');
    }
    return { ...creds, accountNumber };
  }

  private handleProviderError(error: any, operation: string, carrier: CarrierCode): never {
    if (error instanceof ProviderConfigurationError || error instanceof CarrierRateError || error instanceof LabelGenerationFailedError || error instanceof TrackingInfoUnavailableError) {
      throw error;
    }
    this.logger.error(`DHL ${operation} failed: ${error.message}`, error.stack);
    if (operation === 'getRates') throw new CarrierRateError(carrier, error);
    if (operation === 'createLabel') throw new LabelGenerationFailedError(`DHL: ${error.message}`);
    if (operation === 'getTrackingDetails') throw new TrackingInfoUnavailableError(`DHL: ${error.message}`);
    throw new Error(`DHL: Unknown error during ${operation}: ${error.message}`);
  }
}