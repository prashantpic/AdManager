import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsPasswordCompliant, PasswordPolicyOptions } from '../password-policy.validator';

// IMPORTANT: These PasswordPolicyOptions should ideally be sourced from UserAuthConfigService at runtime.
// See comment in reset-password.dto.ts for more details.
const passwordPolicy: PasswordPolicyOptions = {
  // These are placeholder values. They should be dynamically loaded from UserAuthConfig.
  // minLength: 8, (example - will use validator's default if not specified here)
  // requireUppercase: true, (example)
  // requireLowercase: true, (example)
  // requireNumber: true, (example)
  // requireSpecial: true, (example)
};

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The current password of the authenticated user.',
    example: 'CurrentP@$$wOrd',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password should not be empty.' })
  currentPassword: string;

  @ApiProperty({
    description: 'The new password for the authenticated user.',
    example: 'NewP@$$wOrd123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password should not be empty.' })
  @IsPasswordCompliant(passwordPolicy) // Uses default options from validator or passed options
  newPassword: string;
}