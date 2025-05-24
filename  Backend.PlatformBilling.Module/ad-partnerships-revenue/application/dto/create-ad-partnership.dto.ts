import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Application {
            export namespace Dto {
              export class CreateAdPartnershipDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(255)
                partnerName: string;

                @IsString()
                @IsNotEmpty()
                terms: string;

                @IsObject()
                revenueShareModel: object; // JSON object describing the revenue sharing terms.

                @IsEmail()
                @IsOptional()
                contactEmail?: string;

                @IsDateString()
                startDate: Date;

                @IsDateString()
                @IsOptional()
                endDate?: Date;
              }
            }
          }
        }
      }
    }
  }
}