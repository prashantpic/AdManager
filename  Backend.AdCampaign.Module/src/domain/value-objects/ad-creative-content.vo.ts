import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception';

export class AdCreativeContent {
  public readonly headline: string; // Or headlines: string[] depending on ad network
  public readonly description: string; // Or descriptions: string[]
  public readonly bodyText?: string;
  public readonly callToActionText: string; // e.g., 'Shop Now', 'Learn More'

  constructor(params: {
    headline: string;
    description: string;
    bodyText?: string;
    callToActionText: string;
  }) {
    if (!params.headline || params.headline.trim().length === 0) {
      throw new ArgumentInvalidException('Ad creative headline is required.');
    }
    if (params.headline.length > 50) { // Example limit
      throw new ArgumentInvalidException('Ad creative headline cannot exceed 50 characters.');
    }

    if (!params.description || params.description.trim().length === 0) {
      throw new ArgumentInvalidException('Ad creative description is required.');
    }
    if (params.description.length > 150) { // Example limit
      throw new ArgumentInvalidException('Ad creative description cannot exceed 150 characters.');
    }

    if (params.bodyText && params.bodyText.length > 500) { // Example limit
      throw new ArgumentInvalidException('Ad creative body text cannot exceed 500 characters.');
    }

    if (!params.callToActionText || params.callToActionText.trim().length === 0) {
      throw new ArgumentInvalidException('Ad creative Call-To-Action text is required.');
    }
    if (params.callToActionText.length > 25) { // Example limit
      throw new ArgumentInvalidException('Ad creative Call-To-Action text cannot exceed 25 characters.');
    }

    this.headline = params.headline;
    this.description = params.description;
    this.bodyText = params.bodyText;
    this.callToActionText = params.callToActionText;
  }

  // Getter methods can be added
}