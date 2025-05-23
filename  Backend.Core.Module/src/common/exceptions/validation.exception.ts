import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { CommonErrorCodes } from '../constants/error-codes.constants';
import { BaseException } from './base.exception';

/**
 * @interface IValidationErrors
 * @description Structure for detailed validation errors.
 */
export interface IValidationErrors {
  property: string;
  constraints: { [type: string]: string };
  children?: IValidationErrors[];
}

/**
 * @class ValidationException
 * @description Custom exception for DTO validation errors.
 * @Requirement REQ-14-006, REQ-15-013
 */
export class ValidationException extends BaseException {
  constructor(validationErrors: ValidationError[]) {
    super({
      message: 'Input data validation failed',
      status: HttpStatus.BAD_REQUEST,
      errorCode: CommonErrorCodes.VALIDATION_ERROR,
      details: ValidationException.formatErrors(validationErrors),
    });
  }

  /**
   * Formats class-validator errors into a more structured format.
   * @param errors Array of ValidationError objects.
   * @returns Array of formatted IValidationErrors.
   */
  private static formatErrors(errors: ValidationError[]): IValidationErrors[] {
    return errors.map((err) => ({
      property: err.property,
      constraints: err.constraints || {},
      children: err.children && err.children.length > 0 ? ValidationException.formatErrors(err.children) : undefined,
    }));
  }
}