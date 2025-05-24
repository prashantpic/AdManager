import {
  IsArray,
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
} from 'class-validator';
import { FeeType } from '../../../common/enums/fee-type.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Application {
            export namespace Dto {
              export class UpdateTransactionFeeConfigDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(100)
                @IsOptional()
                name?: string;

                @IsEnum(FeeType)
                @IsOptional()
                feeType?: FeeType;

                @IsNumber()
                @Min(0)
                @IsOptional()
                value?: number;

                @IsArray()
                @IsUUID('4', { each: true })
                @IsOptional()
                applicableSubscriptionPlanIds?: string[];

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