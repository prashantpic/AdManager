import { ApiProperty } from '@nestjs/swagger'; // Assuming Swagger is used for API documentation
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class MfaSetupDto {
  @ApiProperty({
    description: 'The MFA secret key (e.g., base32 encoded string).',
    example: 'JBSWY3DPEHPK3PXP',
  })
  @IsString()
  @IsNotEmpty()
  secret: string;

  @ApiProperty({
    description: 'The OTPAuth URL for QR code generation.',
    example: 'otpauth://totp/AdManager:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AdManager',
  })
  @IsUrl()
  @IsNotEmpty()
  otpauthUrl: string;
}