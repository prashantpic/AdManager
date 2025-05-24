import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Application {
            export namespace Dto {
              export class InitiateDeveloperPayoutDto {
                @IsUUID('4')
                @IsOptional()
                developerId?: string; // If null, process for all developers with pending payouts meeting threshold.

                @IsDateString()
                @IsOptional()
                payoutDate?: Date; // Defaults to now if not provided.

                @IsArray()
                @IsUUID('4', { each: true })
                @IsOptional()
                commissionIds?: string[]; // Specific commission IDs to include; if null, all eligible commissions for the developer(s).

                @IsString()
                @IsOptional()
                payoutMethod?: string; // e.g., 'PAYPAL', 'BANK_TRANSFER', if choices are available.
              }
            }
          }
        }
      }
    }
  }
}