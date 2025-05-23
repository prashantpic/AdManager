import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BaseException } from './base.exception';
import { CommonErrorCodes } from '../constants/error-codes.constants';

/**
 * @file Custom exception for DTO validation errors.
 * @namespace AdManager.Platform.Backend.Core.Common.Exceptions
 * @requirement REQ-14-006, REQ-15-013
 */

export interface DetailedValidationError {
  field: string;
  message: string;
  constraints?: { [type: string]: string };
}

export class ValidationException extends BaseException {
  constructor(validationErrors: ValidationError[] | DetailedValidationError[]) {
    const formattedErrors = ValidationException.formatErrors(validationErrors);
    super(
      'Input validation failed',
      HttpStatus.BAD_REQUEST,
      CommonErrorCodes.VALIDATION_ERROR,
      formattedErrors,
    );
  }

  private static formatErrors(
    errors: ValidationError[] | DetailedValidationError[],
  ): DetailedValidationError[] {
    if (errors.length > 0 && 'property' in errors[0]) {
      // It's ValidationError[]
      return (errors as ValidationError[]).map((err) => ({
        field: err.property,
        message: err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'Invalid value',
        constraints: err.constraints,
      }));
    }
    // It's already DetailedValidationError[]
    return errors as DetailedValidationError[];
  }
}