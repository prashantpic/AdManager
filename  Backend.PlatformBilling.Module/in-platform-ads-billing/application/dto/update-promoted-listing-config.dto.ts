import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { PricingModel } from '../../../common/enums/pricing-model.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Application {
            export namespace Dto {
              export class UpdatePromotedListingConfigDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(100)
                @IsOptional()
                name?: string;

                @IsEnum(PricingModel)
                @IsOptional()
                pricingModel?: PricingModel;

                @IsNumber()
                @Min(0)
                @IsOptional()
                price?: number;

                @IsString()
                @Length(3)
                @IsOptional()
                currency?: string;

                @IsObject()
                @IsOptional()
                bidRules?: object;

                @IsObject()
                @IsOptional()
                placementRules?: object;

                @IsBoolean()
                @IsOptional()
                isActive?: boolean;
              }
            }
          }
        }
      }
    }
  }
}