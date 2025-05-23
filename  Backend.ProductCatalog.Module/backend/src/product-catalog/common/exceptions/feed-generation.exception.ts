// Namespace: AdManager.Platform.Backend.ProductCatalog.Common.Exceptions
import { InternalServerErrorException } from '@nestjs/common';
import { FeedFormat } from '../enums/feed-format.enum'; // Assumed path

/**
 * Exception for feed generation failures.
 * REQ-PCM-003
 */
export class FeedGenerationException extends InternalServerErrorException {
  public readonly catalogId?: string;
  public readonly format?: FeedFormat;
  public readonly causeError?: Error;

  /**
   * @param message A descriptive error message.
   * @param catalogId Optional ID of the catalog for which feed generation failed.
   * @param format Optional format of the feed that failed to generate.
   * @param cause Optional underlying error that caused this exception.
   */
  constructor(
    message: string,
    catalogId?: string,
    format?: FeedFormat,
    cause?: Error,
  ) {
    super(message, { cause, description: 'Feed Generation Failed' });
    this.name = 'FeedGenerationException';
    this.catalogId = catalogId;
    this.format = format;
    this.causeError = cause;
  }
}