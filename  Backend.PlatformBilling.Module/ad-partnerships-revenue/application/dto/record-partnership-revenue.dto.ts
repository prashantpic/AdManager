import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Application {
            export namespace Dto {
              export class RecordPartnershipRevenueDto {
                @IsUUID('4')
                @IsNotEmpty()
                agreementId: string;

                @IsNumber()
                @Min(0)
                revenueAmount: number;

                @IsString()
                @Length(3)
                currency: string;

                @IsDateString()
                periodStart: Date;

                @IsDateString()
                periodEnd: Date;

                @IsString()
                @MaxLength(1000)
                @IsOptional()
                notes?: string;
              }
            }
          }
        }
      }
    }
  }
}