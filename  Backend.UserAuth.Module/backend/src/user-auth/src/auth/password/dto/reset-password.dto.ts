import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsPasswordCompliant, PasswordPolicyOptions } from '../password-policy.validator';

// IMPORTANT: These PasswordPolicyOptions should ideally be sourced from UserAuthConfigService at runtime
// when the application bootstraps, or passed dynamically if the validation framework supports it.
// For DTO decorators, this is challenging. One common approach is to have a service perform this validation
// post-DTO validation, or use a custom validation pipe that can inject UserAuthConfigService.
// Here, we are defining them statically for demonstration, as per the capabilities of class-validator decorators.
// The actual values should match the application's configuration.
const passwordPolicy: PasswordPolicyOptions = {
  // These are placeholder values. They should be dynamically loaded from UserAuthConfig.
  // minLength: 8, (example - will use validator's default if not specified here)
  // requireUppercase: true, (example)
  // requireLowercase: true, (example)
  // requireNumber: true, (example)
  // requireSpecial: true, (example)
};


export class ResetPasswordDto {
  @ApiProperty({
    description: 'The password reset token received by the user.',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token should not be empty.' })
  token: string;

  @ApiProperty({
    description: 'The new password for the user.',
    example: 'P@$$wOrd123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password should not be empty.' })
  @IsPasswordCompliant(passwordPolicy) // Uses default options from validator or passed options
  newPassword: string;
}