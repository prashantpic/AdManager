import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { PricingModel } from '../../../common/enums/pricing-model.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Application {
            export namespace Dto {
              export class CreatePromotedListingConfigDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(100)
                name: string;

                @IsEnum(PricingModel)
                pricingModel: PricingModel;

                @IsNumber()
                @Min(0)
                @IsOptional()
                price?: number; // Applicable for FIXED_FEE, or base for CPM/CPC if not purely bid-based.

                @IsString()
                @Length(3)
                currency: string;

                @IsObject()
                @IsOptional()
                bidRules?: object; // JSON object defining auction type, floor price, etc., if BID_BASED.

                @IsObject()
                placementRules: object; // JSON object defining where and how promoted listings are displayed.
              }
            }
          }
        }
      }
    }
  }
}