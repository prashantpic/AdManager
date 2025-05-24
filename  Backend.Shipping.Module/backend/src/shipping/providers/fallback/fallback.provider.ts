import { Injectable, Logger } from '@nestjs/common';
import { IShippingProvider } from '../../core/interfaces/shipping-provider.interface';
import { CarrierCode } from '../../core/enums/carrier-code.enum';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRateQuoteModel } from '../../core/models/shipping-rate-quote.model';
import { ShippingLabelModel } from '../../core/models/shipping-label.model';
import { TrackingDetailsModel } from '../../core/models/tracking-details.model';
import { MerchantConfigModel } from '../../core/models/merchant-config.model';
import { OperationNotSupportedError } from '../../common/errors/shipping.errors'; // Assumed to exist
import { FallbackShippingService } from './fallback.service'; // Assumed to exist

@Injectable()
export class FallbackShippingProvider implements IShippingProvider {
  private readonly logger = new Logger(FallbackShippingProvider.name);

  constructor(
    private fallbackService: FallbackShippingService,
  ) {}

  getProviderCode(): CarrierCode {
    return CarrierCode.FALLBACK;
  }

  async getRates(
    shipmentDetails: ShipmentDetailsModel,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingRateQuoteModel[]> {
    this.logger.debug(`FallbackProvider: Getting fallback rates for merchant ${merchantConfig.merchantId}`);
    return this.fallbackService.getFallbackRates(shipmentDetails, merchantConfig);
  }

  async createLabel(
    shipmentDetails: ShipmentDetailsModel,
    selectedRateId: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<ShippingLabelModel> {
    this.logger.warn(`FallbackProvider: Label generation attempted for rate ${selectedRateId}. Not supported.`);
    throw new OperationNotSupportedError('Label generation', this.getProviderCode());
  }

  async getTrackingDetails(
    trackingNumber: string,
    merchantConfig: MerchantConfigModel,
  ): Promise<TrackingDetailsModel> {
    this.logger.warn(`FallbackProvider: Tracking details attempted for ${trackingNumber}. Not supported.`);
    throw new OperationNotSupportedError('Tracking', this.getProviderCode());
  }
}