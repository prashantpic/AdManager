import {
  ValidationPipe,
  Injectable,
  ArgumentMetadata,
  BadRequestException, // Will be replaced by ValidationException
  HttpStatus,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Placeholder: Actual ValidationException will be used once available.
import { ValidationException } from '../exceptions/validation.exception';
// Placeholder: Actual ErrorCodesConstants will be used once available.
// import { ErrorCodesConstants } from '../constants/error-codes.constants';

@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Allow conversion of basic types
      },
      exceptionFactory: (errors: ValidationError[]) => {
        // REQ-14-006, REQ-15-013: Throw custom ValidationException
        const formattedErrors = this.formatErrors(errors);
        return new ValidationException(
            formattedErrors,
            'Validation failed',
            // ErrorCodesConstants.VALIDATION_ERROR // Use actual constant
            'VALIDATION_ERROR'
        );
      },
    });
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};
    errors.forEach(err => {
      if (err.constraints) {
        formattedErrors[err.property] = Object.values(err.constraints);
      }
      // Recursively format nested errors if any
      if (err.children && err.children.length > 0) {
        const nestedErrors = this.formatErrors(err.children);
        for (const key in nestedErrors) {
            formattedErrors[`${err.property}.${key}`] = nestedErrors[key];
        }
      }
    });
    return formattedErrors;
  }

  // The 'validate' method is part of the parent ValidationPipe and uses the options provided.
  // We override it here only if we need extremely custom logic not covered by options.
  // For now, relying on the parent's `validate` method with our `exceptionFactory`.
  // public async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
  //   const { metatype } = metadata;
  //   if (!metatype || !this.toValidate(metadata)) {
  //     return value;
  //   }
  //   const object = plainToInstance(metatype, value);
  //   const errors = await validate(object, this.validatorOptions); // validatorOptions from constructor
  //   if (errors.length > 0) {
  //     throw this.exceptionFactory(errors); // Uses the configured exceptionFactory
  //   }
  //   return this.isTransformEnabled ? object : value; // isTransformEnabled from constructor
  // }

  // private toValidate(metadata: ArgumentMetadata): boolean {
  //   const { metatype, type } = metadata;
  //   if (type === 'custom') {
  //     return false;
  //   }
  //   const types: Function[] = [String, Boolean, Number, Array, Object];
  //   return !types.includes(metatype);
  // }
}