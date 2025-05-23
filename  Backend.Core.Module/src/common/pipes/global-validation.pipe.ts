import {
  ValidationPipe,
  Injectable,
  ArgumentMetadata,
  BadRequestException, // Standard NestJS exception
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationException } from '../exceptions/validation.exception'; // Assumed to exist
// import { ErrorCodesConstants } from '../constants/error-codes.constants'; // Assumed to exist

@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Allow conversion of primitive types based on TS type
      },
      exceptionFactory: (errors: ValidationError[]) => {
        // Map class-validator errors to a more structured format if needed
        // The ValidationException class should handle this mapping internally
        // or accept the raw ValidationError[] array.
        return new ValidationException(errors);
      },
    });
  }

  // Override transform if further custom logic is needed,
  // but for standard validation, the constructor options are usually sufficient.
  // public async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
  //   // Custom logic before or after validation if necessary
  //   return super.transform(value, metadata);
  // }
}