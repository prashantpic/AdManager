import { Injectable, Logger } from '@nestjs/common';
import { IAnalyticsDataPoint } from '../../common/interfaces/analytics-data-point.interface';
import { IProcessedEvent } from '../../common/interfaces/processed-event.interface';
import { AnalyticsRepository } from '../../storage/repositories/analytics.repository';
import { ProcessedEventEntity } from '../../storage/entities/processed-event.entity';

/**
 * Central service for transforming various raw analytics events
 * into a common structured format (`IProcessedEvent`).
 */
@Injectable()
export class AnalyticsDataProcessor {
  private readonly logger = new Logger(AnalyticsDataProcessor.name);

  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  /**
   * Generic event processor that routes to specific handlers
   * based on `rawEvent.eventType` or `eventSource`.
   * @param rawEvent The raw analytics data point.
   * @returns A processed event or null if processing fails or event is unsupported.
   */
  async processEvent(rawEvent: IAnalyticsDataPoint): Promise<IProcessedEvent | null> {
    this.logger.log(`Processing event: ${rawEvent.eventType} from ${rawEvent.eventSource} for merchant ${rawEvent.merchantId}`);
    let processedEvent: IProcessedEvent | null = null;

    try {
      // Routing logic based on eventType or eventSource
      // This is a simplified routing. A more complex system might use a map or strategy pattern.
      if (rawEvent.eventType.toLowerCase().includes('sale') || rawEvent.eventType.toLowerCase().includes('order')) {
        processedEvent = await this.processSalesEvent(rawEvent);
      } else if (rawEvent.eventSource.toLowerCase().includes('ads') || rawEvent.eventType.toLowerCase().includes('ad_')) {
        processedEvent = await this.processAdPerformanceEvent(rawEvent);
      } else if (rawEvent.eventType.toLowerCase().includes('customer') || rawEvent.eventType.toLowerCase().includes('user')) {
        processedEvent = await this.processCustomerEvent(rawEvent);
      } else if (rawEvent.eventSource.toLowerCase().includes('affiliate') || rawEvent.eventType.toLowerCase().includes('affiliate')) {
        processedEvent = await this.processAffiliateEvent(rawEvent);
      } else if (rawEvent.eventSource.toLowerCase().includes('discount') || rawEvent.eventType.toLowerCase().includes('discount')) {
        processedEvent = await this.processDiscountEvent(rawEvent);
      } else if (rawEvent.eventSource.toLowerCase().includes('promotedlisting') || rawEvent.eventType.toLowerCase().includes('promoted_listing')) {
        processedEvent = await this.processPromotedListingEvent(rawEvent);
      } else {
        this.logger.warn(`Unsupported event type/source: ${rawEvent.eventType} / ${rawEvent.eventSource}`);
        return null;
      }

      if (processedEvent) {
        const entityToSave = this.mapToEntity(processedEvent);
        await this.analyticsRepository.saveProcessedEvents([entityToSave]); // Assuming saveProcessedEvents can take a single event
        this.logger.log(`Successfully processed and saved event: ${rawEvent.eventType} for merchant ${rawEvent.merchantId}`);
      }
      return processedEvent;

    } catch (error) {
        this.logger.error(`Error processing event type ${rawEvent.eventType} for merchant ${rawEvent.merchantId}: ${error.message}`, error.stack);
        return null; // Or throw specific error
    }
  }

  private mapToEntity(processedEvent: IProcessedEvent): ProcessedEventEntity {
    const entity = new ProcessedEventEntity();
    entity.merchantId = processedEvent.merchantId;
    entity.eventTime = processedEvent.eventTime;
    entity.eventType = processedEvent.eventType;
    entity.dimensions = processedEvent.dimensions;
    entity.metrics = processedEvent.metrics;
    // processingTime is set by default in DB or by @CreateDateColumn
    return entity;
  }

  /**
   * Transforms sales-related raw events.
   * Placeholder implementation.
   */
  async processSalesEvent(rawEvent: IAnalyticsDataPoint): Promise<IProcessedEvent> {
    this.logger.debug(`Processing Sales Event for merchant ${rawEvent.merchantId}`);
    // Example transformation:
    const dimensions: Record<string, string | number | boolean> = {
      productId: rawEvent.payload.productId || 'unknown',
      category: rawEvent.payload.category || 'unknown',
      channel: rawEvent.payload.channel || rawEvent.eventSource,
    };
    const metrics: Record<string, number> = {
      revenue: parseFloat(rawEvent.payload.revenue || rawEvent.payload.totalAmount || 0),
      quantity: parseInt(rawEvent.payload.quantity || 1, 10),
      orderCount: 1, // Assuming one event is one order
    };
    if (rawEvent.payload.tax) metrics.tax = parseFloat(rawEvent.payload.tax);
    if (rawEvent.payload.shipping) metrics.shipping = parseFloat(rawEvent.payload.shipping);


    return {
      merchantId: rawEvent.merchantId,
      eventTime: new Date(rawEvent.eventTimestamp),
      eventType: 'SALE', // Standardized event type
      dimensions,
      metrics,
    };
  }

  /**
   * Transforms ad performance raw events from various networks.
   * Placeholder implementation.
   */
  async processAdPerformanceEvent(rawEvent: IAnalyticsDataPoint): Promise<IProcessedEvent> {
    this.logger.debug(`Processing Ad Performance Event from ${rawEvent.eventSource} for merchant ${rawEvent.merchantId}`);
    const dimensions: Record<string, string | number | boolean> = {
        campaignId: rawEvent.payload.campaignId || rawEvent.payload.campaign_id || 'N/A',
        adGroupId: rawEvent.payload.adGroupId || rawEvent.payload.ad_group_id || 'N/A',
        adId: rawEvent.payload.adId || rawEvent.payload.ad_id || 'N/A',
        adNetwork: rawEvent.eventSource,
    };
    const metrics: Record<string, number> = {
        impressions: parseInt(rawEvent.payload.impressions || 0, 10),
        clicks: parseInt(rawEvent.payload.clicks || 0, 10),
        spend: parseFloat(rawEvent.payload.spend || rawEvent.payload.cost || 0),
        conversions: parseInt(rawEvent.payload.conversions || 0, 10),
    };
    // Add more specific metrics as needed
     if (rawEvent.payload.conversionValue || rawEvent.payload.conversion_value) {
        metrics.conversionValue = parseFloat(rawEvent.payload.conversionValue || rawEvent.payload.conversion_value);
    }


    return {
      merchantId: rawEvent.merchantId,
      eventTime: new Date(rawEvent.eventTimestamp),
      eventType: 'AD_PERFORMANCE', // Standardized event type
      dimensions,
      metrics,
    };
  }

  /**
   * Transforms customer behavior raw events.
   * Placeholder implementation.
   */
  async processCustomerEvent(rawEvent: IAnalyticsDataPoint): Promise<IProcessedEvent> {
    this.logger.debug(`Processing Customer Event (${rawEvent.eventType}) for merchant ${rawEvent.merchantId}`);
     const dimensions: Record<string, string | number | boolean> = {
        customerId: rawEvent.payload.customerId || 'anonymous',
        pageUrl: rawEvent.payload.pageUrl || 'N/A',
        deviceType: rawEvent.payload.deviceType || 'unknown',
    };
    const metrics: Record<string, number> = {};

    if (rawEvent.eventType.toLowerCase() === 'page_view') {
        metrics.pageViews = 1;
    } else if (rawEvent.eventType.toLowerCase() === 'add_to_cart') {
        metrics.addToCart = 1;
        if(rawEvent.payload.itemValue) metrics.addToCartValue = parseFloat(rawEvent.payload.itemValue);
    }
    // Add more customer event types and their specific metrics/dimensions

    return {
      merchantId: rawEvent.merchantId,
      eventTime: new Date(rawEvent.eventTimestamp),
      eventType: rawEvent.eventType.toUpperCase(), // Use the specific customer event type
      dimensions,
      metrics,
    };
  }

  /**
   * Transforms affiliate-related raw events.
   * Placeholder implementation.
   */
  async processAffiliateEvent(rawEvent: IAnalyticsDataPoint): Promise<IProcessedEvent> {
    this.logger.debug(`Processing Affiliate Event from ${rawEvent.eventSource} for merchant ${rawEvent.merchantId}`);
    const dimensions: Record<string, string | number | boolean> = {
        affiliateId: rawEvent.payload.affiliateId || 'N/A',
        campaignId: rawEvent.payload.campaignId || 'N/A', // Affiliate campaign if applicable
        source: rawEvent.payload.source || rawEvent.eventSource,
    };
    const metrics: Record<string, number> = {
        clicks: rawEvent.eventType === 'AFFILIATE_CLICK' ? 1 : 0,
        conversions: rawEvent.eventType === 'AFFILIATE_CONVERSION' ? 1 : 0,
        commission: parseFloat(rawEvent.payload.commission || 0),
    };
    if (rawEvent.eventType === 'AFFILIATE_CONVERSION' && rawEvent.payload.orderValue) {
        metrics.orderValue = parseFloat(rawEvent.payload.orderValue);
    }

    return {
      merchantId: rawEvent.merchantId,
      eventTime: new Date(rawEvent.eventTimestamp),
      eventType: rawEvent.eventType.toUpperCase(), // e.g., AFFILIATE_CONVERSION, AFFILIATE_CLICK
      dimensions,
      metrics,
    };
  }

  /**
   * Transforms discount usage raw events.
   * Placeholder implementation.
   */
  async processDiscountEvent(rawEvent: IAnalyticsDataPoint): Promise<IProcessedEvent> {
    this.logger.debug(`Processing Discount Event for merchant ${rawEvent.merchantId}`);
    const dimensions: Record<string, string | number | boolean> = {
        discountCode: rawEvent.payload.discountCode || 'N/A',
        orderId: rawEvent.payload.orderId || 'N/A',
    };
    const metrics: Record<string, number> = {
        discountAppliedCount: 1,
        discountAmount: parseFloat(rawEvent.payload.discountAmount || 0),
    };

    return {
      merchantId: rawEvent.merchantId,
      eventTime: new Date(rawEvent.eventTimestamp),
      eventType: 'DISCOUNT_USED',
      dimensions,
      metrics,
    };
  }

  /**
   * Transforms promoted listing interaction raw events.
   * Placeholder implementation.
   */
  async processPromotedListingEvent(rawEvent: IAnalyticsDataPoint): Promise<IProcessedEvent> {
    this.logger.debug(`Processing Promoted Listing Event for merchant ${rawEvent.merchantId}`);
    const dimensions: Record<string, string | number | boolean> = {
        listingId: rawEvent.payload.listingId || 'N/A',
        placement: rawEvent.payload.placement || 'unknown',
    };
    const metrics: Record<string, number> = {
        impressions: rawEvent.eventType === 'PROMOTED_LISTING_IMPRESSION' ? 1 : 0,
        clicks: rawEvent.eventType === 'PROMOTED_LISTING_CLICK' ? 1 : 0,
    };
     if (rawEvent.payload.cost) {
        metrics.cost = parseFloat(rawEvent.payload.cost);
    }

    return {
      merchantId: rawEvent.merchantId,
      eventTime: new Date(rawEvent.eventTimestamp),
      eventType: rawEvent.eventType.toUpperCase(),
      dimensions,
      metrics,
    };
  }
}