import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class MfaValidateDto {
  @ApiProperty({
    description: 'The MFA token (e.g., a 6-digit code) provided by the user.',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'MFA token must be 6 digits.' })
  mfaToken: string;
}