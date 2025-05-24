import {
  AllowNull,
  IsBoolean,
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
              export class UpdateAdPartnershipDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(255)
                @IsOptional()
                partnerName?: string;

                @IsString()
                @IsNotEmpty()
                @IsOptional()
                terms?: string;

                @IsObject()
                @IsOptional()
                revenueShareModel?: object;

                @IsEmail()
                @IsOptional()
                contactEmail?: string;

                @IsDateString()
                @IsOptional()
                startDate?: Date;

                @IsDateString()
                @IsOptional()
                @AllowNull()
                endDate?: Date | null;

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