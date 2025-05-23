import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

export interface PasswordPolicyOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

// Default policy values if not provided in options.
// In a real scenario, these defaults might also come from a static config or be non-configurable parts of the policy.
const DEFAULT_MIN_LENGTH = 8;
const DEFAULT_REQUIRE_UPPERCASE = true;
const DEFAULT_REQUIRE_LOWERCASE = true;
const DEFAULT_REQUIRE_NUMBER = true;
const DEFAULT_REQUIRE_SPECIAL = true;

@ValidatorConstraint({ name: 'isPasswordCompliant', async: false })
export class PasswordPolicyConstraint implements ValidatorConstraintInterface {
  private static readonly SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
  private static readonly UPPERCASE_REGEX = /[A-Z]/;
  private static readonly LOWERCASE_REGEX = /[a-z]/;
  private static readonly NUMBER_REGEX = /[0-9]/;

  private validationErrorMessages: string[] = [];

  validate(password: any, args: ValidationArguments) {
    this.validationErrorMessages = []; // Reset for current validation

    if (typeof password !== 'string') {
      // This case should ideally be caught by @IsString() before this validator runs.
      // If it reaches here, it means @IsString was not used or password is null/undefined.
      this.validationErrorMessages.push('Password must be a string.');
      return false;
    }

    const options = (args.constraints[0] || {}) as PasswordPolicyOptions;

    const minLength = options.minLength ?? DEFAULT_MIN_LENGTH;
    const requireUppercase = options.requireUppercase ?? DEFAULT_REQUIRE_UPPERCASE;
    const requireLowercase = options.requireLowercase ?? DEFAULT_REQUIRE_LOWERCASE;
    const requireNumber = options.requireNumber ?? DEFAULT_REQUIRE_NUMBER;
    const requireSpecial = options.requireSpecial ?? DEFAULT_REQUIRE_SPECIAL;

    if (password.length < minLength) {
      this.validationErrorMessages.push(
        `Password must be at least ${minLength} characters long.`,
      );
    }
    if (requireUppercase && !PasswordPolicyConstraint.UPPERCASE_REGEX.test(password)) {
      this.validationErrorMessages.push(
        'Password must contain at least one uppercase letter.',
      );
    }
    if (requireLowercase && !PasswordPolicyConstraint.LOWERCASE_REGEX.test(password)) {
      this.validationErrorMessages.push(
        'Password must contain at least one lowercase letter.',
      );
    }
    if (requireNumber && !PasswordPolicyConstraint.NUMBER_REGEX.test(password)) {
      this.validationErrorMessages.push(
        'Password must contain at least one number.',
      );
    }
    if (requireSpecial && !PasswordPolicyConstraint.SPECIAL_CHAR_REGEX.test(password)) {
      this.validationErrorMessages.push(
        'Password must contain at least one special character.',
      );
    }

    return this.validationErrorMessages.length === 0;
  }

  defaultMessage(args: ValidationArguments) {
    if (this.validationErrorMessages.length > 0) {
      return this.validationErrorMessages.join(' ');
    }
    // Fallback message, though validate should always populate messages on failure.
    return 'Password does not meet the required policy.';
  }
}

export function IsPasswordCompliant(
  options?: PasswordPolicyOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options],
      validator: PasswordPolicyConstraint,
    });
  };
}