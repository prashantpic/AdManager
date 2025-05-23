import { Injectable, Logger } from '@nestjs/common';
import { IProcessedEvent } from '../../common/interfaces/processed-event.interface';
import { AttributionModel } from '../../common/enums/attribution-model.enum';
import { ConfigService } from '@nestjs/config';

/**
 * Provides functionality for applying various attribution models to analyze marketing effectiveness.
 */
@Injectable()
export class AttributionService {
  private readonly logger = new Logger(AttributionService.name);
  private readonly enableAdvancedAttributionModels: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enableAdvancedAttributionModels = this.configService.get<boolean>('featureFlags.enableAdvancedAttributionModels', false);
  }

  /**
   * Applies the specified attribution model to a set of touchpoints for a conversion.
   * @param touchpoints - Array of processed events representing user interactions.
   * @param model - The attribution model to apply.
   * @param conversionValue - The value of the conversion (e.g., revenue).
   * @param conversionEventTime - The timestamp of the conversion event.
   * @param config - Optional configuration for the attribution model (e.g., lookback window).
   * @returns A promise resolving to a record mapping touchpoint identifiers/channels to their attributed value.
   */
  async applyAttribution(
    touchpoints: IProcessedEvent[],
    model: AttributionModel,
    conversionValue: number,
    conversionEventTime: Date,
    config?: { lookbackWindowDays?: number; channelDimension?: string },
  ): Promise<Record<string, number>> {
    this.logger.log(
      `Applying attribution model: ${model} for conversion value: ${conversionValue}`,
    );

    const lookbackWindowDays = config?.lookbackWindowDays || 30; // Default lookback window
    const channelDimension = config?.channelDimension || 'eventSource'; // Default dimension to attribute credit

    const relevantTouchpoints = touchpoints
      .filter(tp => {
        const eventTime = new Date(tp.eventTime).getTime();
        const conversionTime = new Date(conversionEventTime).getTime();
        const diffDays = (conversionTime - eventTime) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= lookbackWindowDays;
      })
      .sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());

    if (relevantTouchpoints.length === 0) {
      this.logger.log('No relevant touchpoints found within the lookback window.');
      // Depending on strategy, could attribute to 'Direct' or return empty
      return { 'Direct': conversionValue };
    }

    const attributedValues: Record<string, number> = {};

    switch (model) {
      case AttributionModel.LAST_CLICK:
        const lastTouchpoint = relevantTouchpoints[relevantTouchpoints.length - 1];
        const lastClickChannel = lastTouchpoint.dimensions[channelDimension]?.toString() || 'Unknown';
        attributedValues[lastClickChannel] = (attributedValues[lastClickChannel] || 0) + conversionValue;
        break;

      case AttributionModel.FIRST_CLICK:
        const firstTouchpoint = relevantTouchpoints[0];
        const firstClickChannel = firstTouchpoint.dimensions[channelDimension]?.toString() || 'Unknown';
        attributedValues[firstClickChannel] = (attributedValues[firstClickChannel] || 0) + conversionValue;
        break;

      case AttributionModel.LINEAR:
        const creditPerTouchpoint = conversionValue / relevantTouchpoints.length;
        relevantTouchpoints.forEach(tp => {
          const linearChannel = tp.dimensions[channelDimension]?.toString() || 'Unknown';
          attributedValues[linearChannel] = (attributedValues[linearChannel] || 0) + creditPerTouchpoint;
        });
        break;
      
      // Example for an advanced model if the flag is enabled
      // case AttributionModel.TIME_DECAY:
      //   if (this.enableAdvancedAttributionModels) {
      //     // Implement time decay logic
      //   } else {
      //     this.logger.warn(`Time Decay model requested but advanced models are not enabled. Falling back to Linear.`);
      //     // Fallback or throw error
      //      const creditPerTouchpointTimeDecay = conversionValue / relevantTouchpoints.length; // Simplified fallback
      //       relevantTouchpoints.forEach(tp => {
      //           const channel = tp.dimensions[channelDimension]?.toString() || 'Unknown';
      //           attributedValues[channel] = (attributedValues[channel] || 0) + creditPerTouchpointTimeDecay;
      //       });
      //   }
      //   break;

      default:
        this.logger.warn(`Unsupported attribution model: ${model}. Falling back to Last Click.`);
        const defaultTouchpoint = relevantTouchpoints[relevantTouchpoints.length - 1];
        const defaultChannel = defaultTouchpoint.dimensions[channelDimension]?.toString() || 'Unknown';
        attributedValues[defaultChannel] = (attributedValues[defaultChannel] || 0) + conversionValue;
        break;
    }

    this.logger.log(`Attribution complete: ${JSON.stringify(attributedValues)}`);
    return attributedValues;
  }
}