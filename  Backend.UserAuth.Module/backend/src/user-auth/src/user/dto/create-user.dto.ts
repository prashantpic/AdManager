import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
// import { PasswordPolicy } from '../../auth/password/decorators/password-policy.decorator'; // If a custom decorator is made

export class CreateUserDto {
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  @MaxLength(255)
  email: string;

  // Password validation here is basic. Stronger policy is enforced by PasswordService/PasswordPolicyValidator
  // This DTO ensures the basic structure.
  @IsNotEmpty({ message: 'Password cannot be empty.' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' }) // Example: From SDS UserAuthConfig passwordMinLength
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters.' })
  // Example: one uppercase, one lowercase, one number, one special character
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
  //   message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
  // })
  // Note: The above Matches regex is an example. Actual policy comes from UserAuthConfig.
  // A custom validator @PasswordPolicy() would be cleaner.
  password: string;

  @IsNotEmpty({ message: 'First name cannot be empty.' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty({ message: 'Last name cannot be empty.' })
  @IsString()
  @MaxLength(100)
  lastName: string;
}