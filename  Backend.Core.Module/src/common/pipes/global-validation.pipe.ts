import {
  ValidationPipe,
  Injectable,
  ArgumentMetadata,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationException } from '../exceptions/validation.exception';

@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = this.formatErrors(errors);
        return new ValidationException(formattedErrors);
      },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // Default, but ValidationException will override
    });
  }

  public async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // For GET requests with query parameters, class-transformer might not run if `expectedType` is primitive.
    // We ensure DTOs are always processed.
    if (!metadata.metatype || !this.toValidate(metadata)) {
        return value;
    }
    try {
      return await super.transform(value, metadata);
    } catch (e) {
      if (e instanceof ValidationException) {
        throw e;
      }
      // Fallback for other errors during validation, though exceptionFactory should catch most
      if (e instanceof HttpException) {
          throw e; // rethrow if it's already an HttpException (e.g. from super.transform if not using our factory)
      }
      // This path should ideally not be hit if class-validator errors are correctly handled by exceptionFactory
      throw new ValidationException([{ property: 'unknown', constraints: { unhandled: e.message || 'Unhandled validation error' } }]);
    }
  }

  private formatErrors(errors: ValidationError[]): any[] {
    return errors.map((err) => {
      // Preserve the nested structure if present
      const formatChildError = (childError: ValidationError): any => {
        return {
          property: childError.property,
          value: childError.value,
          constraints: childError.constraints,
          children: childError.children && childError.children.length > 0 ? this.formatErrors(childError.children) : undefined,
        };
      };
      return formatChildError(err);
    });
  }
}