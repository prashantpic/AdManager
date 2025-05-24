import {
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Application {
            export namespace Dto {
              export class PurchasePromotedListingDto {
                @IsUUID('4')
                promotedListingConfigId: string;

                @IsUUID('4')
                productId: string; // Merchant's product to be promoted.

                @IsNumber()
                @Min(0)
                @IsOptional()
                bidAmount?: number; // Required if pricing model is BID_BASED.

                @IsNumber()
                @Min(0)
                @IsOptional()
                budget?: number; // Max spend for this promotion if applicable.

                @IsInt()
                @Min(1)
                @IsOptional()
                durationDays?: number;
              }
            }
          }
        }
      }
    }
  }
}