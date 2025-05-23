import { HttpException, HttpStatus } from '@nestjs/common';

export class CreativeAssetUploadException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR, // Or UNPROCESSABLE_ENTITY if file format/content issue
        message: message || 'Creative asset upload failed.',
        details,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}