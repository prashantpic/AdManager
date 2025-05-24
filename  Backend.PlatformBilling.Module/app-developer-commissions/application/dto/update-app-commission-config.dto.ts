import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  AllowNull,
} from 'class-validator';
import { FeeType } from '../../../common/enums/fee-type.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Application {
            export namespace Dto {
              export class UpdateAppCommissionConfigDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(100)
                @IsOptional()
                name?: string;

                @IsUUID('4')
                @IsOptional()
                @AllowNull()
                appId?: string | null;

                @IsUUID('4')
                @IsOptional()
                @AllowNull()
                developerId?: string | null;

                @IsNumber()
                @Min(0)
                @IsOptional()
                rate?: number;

                @IsEnum(FeeType)
                @IsOptional()
                rateType?: FeeType;

                @IsString()
                @IsNotEmpty()
                @IsOptional()
                calculationBasis?: string;

                @IsString()
                @Length(3)
                @IsOptional()
                currency?: string;

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