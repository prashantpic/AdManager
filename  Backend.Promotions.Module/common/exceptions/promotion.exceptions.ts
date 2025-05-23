import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * REQ-PM-008: Real-time validation implies clear error states.
 */

export class PromotionNotFoundException extends HttpException {
  constructor(message = 'Promotion not found.') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class PromotionNotApplicableException extends HttpException {
  constructor(message = 'Promotion is not applicable to the current context.') {
    super(message, HttpStatus.BAD_REQUEST); // 400 Bad Request, as context doesn't meet criteria
  }
}

export class InvalidPromotionCodeException extends HttpException {
  constructor(message = 'Invalid or non-existent promotion code.') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class PromotionExpiredException extends PromotionNotApplicableException {
  constructor(message = 'This promotion has expired.') {
    super(message); // Inherits HttpStatus.BAD_REQUEST
  }
}

export class PromotionUsageLimitExceededException extends PromotionNotApplicableException {
  constructor(message = 'This promotion has reached its usage limit.') {
    super(message);
  }
}

export class PromotionInactiveException extends PromotionNotApplicableException {
  constructor(message = 'This promotion is not currently active.') {
    super(message);
  }
}

export class StackingConflictException extends HttpException {
  constructor(message = 'This promotion cannot be combined with other applied promotions.') {
    super(message, HttpStatus.CONFLICT); // 409 Conflict
  }
}

export class BulkGenerationFailedException extends HttpException {
  constructor(message = 'Bulk generation of promotion codes failed.') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ImportExportFailedException extends HttpException {
  constructor(message = 'Promotion import/export operation failed.') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class InvalidPromotionDataException extends HttpException {
  constructor(message = 'Invalid promotion data provided.') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}