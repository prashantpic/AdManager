import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TokenPayloadDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @IsBoolean()
  isMfaAuthenticated: boolean;
}