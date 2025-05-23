import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token should not be empty.' })
  @IsString({ message: 'Refresh token must be a string.' })
  refreshToken: string;
}