// Namespace: AdManager.Platform.Backend.ProductCatalog.Common.Exceptions
import { HttpException, HttpStatus } from '@nestjs/common';
import { AdPlatform } from '../enums/ad-platform.enum'; // Assumed path

/**
 * Exception for synchronization failures with an ad platform.
 * REQ-PCM-009, REQ-PCM-007
 */
export class SyncFailedException extends HttpException {
  public readonly platform: AdPlatform;
  public readonly platformErrorCode?: string;
  public readonly isTransient: boolean;
  public readonly causeError?: Error;

  /**
   * @param message A descriptive error message.
   * @param platform The ad platform for which synchronization failed.
   * @param platformErrorCode Optional error code from the ad platform.
   * @param isTransient Indicates if the error is considered transient (and thus potentially retryable).
   * @param cause Optional underlying error that caused this exception.
   */
  constructor(
    message: string,
    platform: AdPlatform,
    platformErrorCode?: string,
    isTransient: boolean = false,
    cause?: Error,
  ) {
    const status = isTransient
      ? HttpStatus.SERVICE_UNAVAILABLE
      : HttpStatus.BAD_GATEWAY; // Or HttpStatus.INTERNAL_SERVER_ERROR if preferred for non-transient internal issues

    super(
      HttpException.createBody(message, `Sync Failed with ${platform}`, status),
      status,
      { cause },
    );
    this.name = 'SyncFailedException';
    this.platform = platform;
    this.platformErrorCode = platformErrorCode;
    this.isTransient = isTransient;
    this.causeError = cause;
  }
}