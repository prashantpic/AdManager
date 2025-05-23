import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty, ArrayMinSize } from 'class-validator';

export class MfaRecoveryCodesDto {
  @ApiProperty({
    description: 'A list of MFA recovery codes.',
    example: ['abcdef1234', '1234abcdef', 'ghijkl5678'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1) // Typically a set number of codes are generated e.g. 5 or 10
  @IsString({ each: true })
  recoveryCodes: string[];
}