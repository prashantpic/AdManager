import { Injectable, Logger } from '@nestjs/common';
import { IShippingProvider } from '../../core/interfaces/shipping-provider.interface';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { MerchantConfigModel } from '../../core/models/merchant-config.model';
import { FedExMapper } from './fedex.mapper'; // Assumed to exist
import { HttpClientService } from '@admanager/backend.core.module'; // Assumed to exist
import { ShippingConfigService } from '../../config/shipping-config.service'; // Assumed to exist
import { FedExApiDtos } from './dto/fedex-api.dtos'; // Assumed to exist
import {
  CarrierRateError,
  LabelGenerationFailedError,
  ProviderConfigurationError,
  TrackingInfoUnavailableError,
} from '../../common/errors/shipping.errors'; // Assumed to exist

@Injectable()
export class FedExShippingProvider implements IShippingProvider {
  private readonly logger = new Logger(FedExShippingProvider.name);
  private apiUrl: string;
  private timeout: number;

  constructor(
    private fedexMapper: FedExMapper,
    private httpClient: HttpClientService,
    private configService: ShippingConfigService,
  ) {
    this.apiUrl = this.configService.getProviderApiUrl(CarrierCode.FEDEX) || 'https://apis.fedex.com'; // Example URL
    this.timeout = this.configService.getProviderTimeout(CarrierCode.FEDEX);
  }

  getProviderCode(): CarrierCode {
    return CarrierCode.FEDEX;
  }

  async getRates(
    shipmentDetails: ShipmentDetailsModel,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingRateQuoteModel[]> {
    this.logger.debug(`FedEx: Fetching rates for merchant ${merchantConfig.merchantId}`);
    try {
      const { apiKey, accountNumber } = await this.getCredentials(merchantConfig);
      const fedexRequest = this.fedexMapper.toFedExRateRequest(shipmentDetails, accountNumber);
      const url = `${this.apiUrl}/rate/v1/rates/quotes`; // Example actual FedEx endpoint might differ

      const response = await this.httpClient.post<FedExApiDtos.FedExRateResponseDto>(url, fedexRequest, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });

      if (response.status !== 200 || !response.data?.output?.rateReplyDetails) {
        this.logger.error(`FedEx Rate API error: Status ${response.status}`, response.data);
        throw new CarrierRateError(CarrierCode.FEDEX, response.data);
      }
      return this.fedexMapper.fromFedExRateResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'getRates', CarrierCode.FEDEX);
    }
  }

  async createLabel(
    shipmentDetails: ShipmentDetailsModel,
    selectedRateId: string, // This ID should map to a previously fetched FedEx rate object
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingLabelModel> {
    this.logger.debug(`FedEx: Creating label for merchant ${merchantConfig.merchantId}, rate ID ${selectedRateId}`);
    try {
      const { apiKey, accountNumber } = await this.getCredentials(merchantConfig);
      // Retrieve the full selectedRate object based on selectedRateId (e.g., from cache or service)
      // This is a simplification; real implementation needs to fetch/reconstruct this.
      const selectedRateObject = { carrierCode: CarrierCode.FEDEX, serviceCode: 'FEDEX_GROUND', originalProviderRate: {} } as ShippingRateQuoteModel; // Placeholder
      
      const fedexRequest = this.fedexMapper.toFedExLabelRequest(shipmentDetails, selectedRateObject, accountNumber);
      const url = `${this.apiUrl}/ship/v1/shipments`; // Example actual FedEx endpoint might differ

      const response = await this.httpClient.post<FedExApiDtos.FedExLabelResponseDto>(url, fedexRequest, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });

      if (response.status !== 200 || !response.data?.output?.transactionShipments?.[0]?.pieceResponses?.[0]?.label?.image) {
        this.logger.error(`FedEx Label API error: Status ${response.status}`, response.data);
        throw new LabelGenerationFailedError('FedEx label generation failed.');
      }
      return this.fedexMapper.fromFedExLabelResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'createLabel', CarrierCode.FEDEX);
    }
  }

  async getTrackingDetails(
    trackingNumber: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<TrackingDetailsModel> {
    this.logger.debug(`FedEx: Getting tracking for ${trackingNumber}, merchant ${merchantConfig.merchantId}`);
    try {
      const { apiKey } = await this.getCredentials(merchantConfig); // Account number might not be needed for tracking
      // const fedexRequest = this.fedexMapper.toFedExTrackingRequest(trackingNumber); // Assuming mapper creates this
      const fedexRequestPayload = { trackingInfo: [{ trackingNumberInfo: { trackingNumber } }] }; // Example payload structure
      const url = `${this.apiUrl}/track/v1/trackingnumbers`; // Example actual FedEx endpoint might differ

      const response = await this.httpClient.post<FedExApiDtos.FedExTrackingResponseDto>(url, fedexRequestPayload, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });

      if (response.status !== 200 || !response.data?.output?.completeTrackResults?.[0]?.trackingNumber) {
        this.logger.error(`FedEx Tracking API error: Status ${response.status}`, response.data);
        throw new TrackingInfoUnavailableError('FedEx tracking info unavailable.');
      }
      const trackingDetails = this.fedexMapper.fromFedExTrackingResponse(response.data);
      if (!trackingDetails) throw new TrackingInfoUnavailableError('No FedEx tracking details mapped.');
      return trackingDetails;
    } catch (error) {
      this.handleProviderError(error, 'getTrackingDetails', CarrierCode.FEDEX);
    }
  }

  private async getCredentials(merchantConfig: MerchantConfigModel): Promise<{ apiKey: string; accountNumber: string }> {
    if (!merchantConfig.credentialsRef) {
      throw new ProviderConfigurationError(CarrierCode.FEDEX, 'credentialsRef missing');
    }
    // In a real scenario, credentialsRef might be a JSON string with multiple keys or a single key for a secret object
    // For simplicity, assume credentialsRef directly maps to an API key secret name.
    // And accountNumber is either in merchantConfig or a separate secret.
    const apiKey = await this.configService.getSecret(merchantConfig.credentialsRef); // Example mapping
    const accountNumber = merchantConfig.accountNumber || await this.configService.getSecret(`${merchantConfig.credentialsRef}_ACCOUNT`); // Example

    if (!apiKey || !accountNumber) {
      throw new ProviderConfigurationError(CarrierCode.FEDEX, 'API Key or Account Number missing');
    }
    return { apiKey, accountNumber };
  }

  private handleProviderError(error: any, operation: string, carrier: CarrierCode): never {
    if (error instanceof ProviderConfigurationError || error instanceof CarrierRateError || error instanceof LabelGenerationFailedError || error instanceof TrackingInfoUnavailableError) {
      throw error;
    }
    this.logger.error(`FedEx ${operation} failed: ${error.message}`, error.stack);
    if (operation === 'getRates') throw new CarrierRateError(carrier, error);
    if (operation === 'createLabel') throw new LabelGenerationFailedError(`FedEx: ${error.message}`);
    if (operation === 'getTrackingDetails') throw new TrackingInfoUnavailableError(`FedEx: ${error.message}`);
    throw new Error(`FedEx: Unknown error during ${operation}: ${error.message}`);
  }
}