import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { FeeType } from '../../../common/enums/fee-type.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Application {
            export namespace Dto {
              export class CreateAppCommissionConfigDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(100)
                name: string;

                @IsUUID('4')
                @IsOptional()
                appId?: string; // Specific app or null for developer-wide default.

                @IsUUID('4')
                @IsOptional()
                developerId?: string; // Specific developer or null for platform-wide default for unassigned apps.

                @IsNumber()
                @Min(0)
                rate: number;

                @IsEnum(FeeType)
                rateType: FeeType;

                @IsString()
                @IsNotEmpty()
                calculationBasis: string; // e.g., 'NET_REVENUE', 'GROSS_REVENUE_AFTER_PLATFORM_FEES'

                @IsString()
                @Length(3)
                currency: string;
              }
            }
          }
        }
      }
    }
  }
}