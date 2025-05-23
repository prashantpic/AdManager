import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssociateCreativeDto {
  @IsUUID('4')
  @IsNotEmpty()
  creativeId: string;

  // Optionally, ad-specific content overrides can be provided here
  // @ValidateNested()
  // @Type(() => AdCreativeContentDto)
  // @IsOptional()
  // creativeContent?: AdCreativeContentDto;
}