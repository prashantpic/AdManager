import { IsString, IsNotEmpty, Length, IsEnum } from 'class-validator';
import { CreativeType } from '../../../constants/creative-type.enum';

export class UploadCreativeAssetDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @IsEnum(CreativeType)
  @IsNotEmpty()
  type: CreativeType;

  // File itself is handled by NestJS @UploadedFile() decorator and interceptors.
  // This DTO carries the metadata sent along with the file.
  // Optional:
  // @IsString()
  // @IsOptional()
  // description?: string;
}