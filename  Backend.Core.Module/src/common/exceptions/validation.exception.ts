import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BaseException } from './base.exception';
import { ErrorCodes } from '../constants/error-codes.constants';

/**
 * @description Custom exception for DTO validation errors.
 * REQ-14-006, REQ-15-013
 */
export class ValidationException extends BaseException {
  constructor(errors: ValidationError[]) {
    super(
      'Input data validation failed',
      HttpStatus.BAD_REQUEST,
      ErrorCodes.VALIDATION_ERROR,
      ValidationException.formatErrors(errors),
    );
  }

  private static formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};
    errors.forEach((err) => {
      if (err.constraints) {
        formattedErrors[err.property] = Object.values(err.constraints);
      }
      // Handle nested validation errors if present
      if (err.children && err.children.length > 0) {
        const nestedErrors = this.formatErrors(err.children);
        for (const key in nestedErrors) {
          formattedErrors[`${err.property}.${key}`] = nestedErrors[key];
        }
      }
    });
    return formattedErrors;
  }
}