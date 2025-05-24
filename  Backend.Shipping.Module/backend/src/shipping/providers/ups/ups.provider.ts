import { Injectable, Logger } from '@nestjs/common';
import { IShippingProvider } from '../../core/interfaces/shipping-provider.interface';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { MerchantConfigModel } from '../../core/models/merchant-config.model';
import { UPSMapper } from './ups.mapper'; // Assumed to exist
import { HttpClientService } from '@admanager/backend.core.module'; // Assumed to exist
import { ShippingConfigService } from '../../config/shipping-config.service'; // Assumed to exist
import { UPSApiDtos } from './dto/ups-api.dtos'; // Assumed to exist
import {
  CarrierRateError,
  LabelGenerationFailedError,
  ProviderConfigurationError,
  TrackingInfoUnavailableError,
} from '../../common/errors/shipping.errors'; // Assumed to exist

@Injectable()
export class UPSShippingProvider implements IShippingProvider {
  private readonly logger = new Logger(UPSShippingProvider.name);
  private apiUrl: string;
  private timeout: number;

  constructor(
    private upsMapper: UPSMapper,
    private httpClient: HttpClientService,
    private configService: ShippingConfigService,
  ) {
    this.apiUrl = this.configService.getProviderApiUrl(CarrierCode.UPS) || 'https://onlinetools.ups.com/rest'; // Example URL
    this.timeout = this.configService.getProviderTimeout(CarrierCode.UPS);
  }

  getProviderCode(): CarrierCode {
    return CarrierCode.UPS;
  }

  async getRates(
    shipmentDetails: ShipmentDetailsModel,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingRateQuoteModel[]> {
    this.logger.debug(`UPS: Fetching rates for merchant ${merchantConfig.merchantId}`);
    try {
      const { accessLicenseNumber, userId, password, accountNumber } = await this.getCredentials(merchantConfig);
      const upsRequest = this.upsMapper.toUPSRateRequest(shipmentDetails, accountNumber);
      const url = `${this.apiUrl}/Rate`;

      const response = await this.httpClient.post<UPSApiDtos.UPSRateResponseDto>(url, upsRequest, {
        headers: {
          'Content-Type': 'application/json',
          'AccessLicenseNumber': accessLicenseNumber,
          'Username': userId,
          'Password': password,
        },
        timeout: this.timeout,
      });

      const responseStatus = response.data?.RateResponse?.Response?.ResponseStatus;
      if (response.status !== 200 || responseStatus?.Code !== '1') {
        this.logger.error(`UPS Rate API error: Status ${response.status}, UPS Response: ${responseStatus?.Code} - ${responseStatus?.Description}`, response.data);
        throw new CarrierRateError(CarrierCode.UPS, response.data);
      }
      return this.upsMapper.fromUPSRateResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'getRates', CarrierCode.UPS);
    }
  }

  async createLabel(
    shipmentDetails: ShipmentDetailsModel,
    selectedRateId: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingLabelModel> {
    this.logger.debug(`UPS: Creating label for merchant ${merchantConfig.merchantId}, rate ID ${selectedRateId}`);
    try {
      const { accessLicenseNumber, userId, password, accountNumber } = await this.getCredentials(merchantConfig);
      // Retrieve the full selectedRate object based on selectedRateId
      const selectedRateObject = { carrierCode: CarrierCode.UPS, serviceCode: '03', originalProviderRate: {} } as ShippingRateQuoteModel; // Placeholder
      
      const upsRequest = this.upsMapper.toUPSLabelRequest(shipmentDetails, selectedRateObject, accountNumber);
      const url = `${this.apiUrl}/Ship`;

      const response = await this.httpClient.post<UPSApiDtos.UPSLabelResponseDto>(url, upsRequest, {
        headers: {
          'Content-Type': 'application/json',
          'AccessLicenseNumber': accessLicenseNumber,
          'Username': userId,
          'Password': password,
        },
        timeout: this.timeout,
      });

      const responseStatus = response.data?.ShipmentResponse?.Response?.ResponseStatus;
      if (response.status !== 200 || responseStatus?.Code !== '1' || !response.data?.ShipmentResponse?.ShipmentResults?.PackageResults?.[0]?.ShippingLabel?.GraphicImage) {
        this.logger.error(`UPS Label API error: Status ${response.status}, UPS Response: ${responseStatus?.Code} - ${responseStatus?.Description}`, response.data);
        throw new LabelGenerationFailedError('UPS label generation failed.');
      }
      return this.upsMapper.fromUPSLabelResponse(response.data);
    } catch (error) {
      this.handleProviderError(error, 'createLabel', CarrierCode.UPS);
    }
  }

  async getTrackingDetails(
    trackingNumber: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<TrackingDetailsModel> {
    this.logger.debug(`UPS: Getting tracking for ${trackingNumber}, merchant ${merchantConfig.merchantId}`);
    try {
      const { accessLicenseNumber, userId, password } = await this.getCredentials(merchantConfig);
      const upsRequestPayload = { TrackRequest: { InquiryNumber: trackingNumber } }; // UPS often uses InquiryNumber
      const url = `${this.apiUrl}/Track`;

      const response = await this.httpClient.post<UPSApiDtos.UPSTrackingResponseDto>(url, upsRequestPayload, {
         headers: {
          'Content-Type': 'application/json',
          'AccessLicenseNumber': accessLicenseNumber,
          'Username': userId,
          'Password': password,
        },
        timeout: this.timeout,
      });
      
      const responseStatus = response.data?.TrackResponse?.Response?.ResponseStatus;
      if (response.status !== 200 || responseStatus?.Code !== '1' || !response.data?.TrackResponse?.Shipment?.[0]?.TrackingNumber) {
        this.logger.error(`UPS Tracking API error: Status ${response.status}, UPS Response: ${responseStatus?.Code} - ${responseStatus?.Description}`, response.data);
        throw new TrackingInfoUnavailableError('UPS tracking info unavailable.');
      }
      const trackingDetails = this.upsMapper.fromUPSTrackingResponse(response.data);
      if (!trackingDetails) throw new TrackingInfoUnavailableError('No UPS tracking details mapped.');
      return trackingDetails;
    } catch (error) {
      this.handleProviderError(error, 'getTrackingDetails', CarrierCode.UPS);
    }
  }

  private async getCredentials(merchantConfig: MerchantConfigModel): Promise<{ accessLicenseNumber: string; userId: string; password: string; accountNumber: string }> {
    if (!merchantConfig.credentialsRef) {
      throw new ProviderConfigurationError(CarrierCode.UPS, 'credentialsRef missing');
    }
    // Assume credentialsRef points to a JSON secret with keys: accessLicenseNumber, userId, password
    const credsString = await this.configService.getSecret(merchantConfig.credentialsRef);
    let creds;
    try {
        creds = JSON.parse(credsString);
    } catch (e) {
        throw new ProviderConfigurationError(CarrierCode.UPS, 'Credentials JSON malformed');
    }

    const accountNumber = merchantConfig.accountNumber || await this.configService.getSecret(`${merchantConfig.credentialsRef}_ACCOUNT`); // Example

    if (!creds.accessLicenseNumber || !creds.userId || !creds.password || !accountNumber) {
      throw new ProviderConfigurationError(CarrierCode.UPS, 'AccessLicenseNumber, UserId, Password, or AccountNumber missing');
    }
    return { ...creds, accountNumber };
  }

  private handleProviderError(error: any, operation: string, carrier: CarrierCode): never {
    if (error instanceof ProviderConfigurationError || error instanceof CarrierRateError || error instanceof LabelGenerationFailedError || error instanceof TrackingInfoUnavailableError) {
      throw error;
    }
    this.logger.error(`UPS ${operation} failed: ${error.message}`, error.stack);
    if (operation === 'getRates') throw new CarrierRateError(carrier, error);
    if (operation === 'createLabel') throw new LabelGenerationFailedError(`UPS: ${error.message}`);
    if (operation === 'getTrackingDetails') throw new TrackingInfoUnavailableError(`UPS: ${error.message}`);
    throw new Error(`UPS: Unknown error during ${operation}: ${error.message}`);
  }
}