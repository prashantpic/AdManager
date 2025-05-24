import {
  IsArray,
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
              export class CreateTransactionFeeConfigDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(100)
                name: string;

                @IsEnum(FeeType)
                feeType: FeeType;

                @IsNumber()
                @Min(0)
                value: number;

                @IsArray()
                @IsUUID('4', { each: true })
                @IsOptional()
                applicableSubscriptionPlanIds?: string[];

                @IsString()
                @IsNotEmpty()
                calculationBasis: string; // e.g., 'TOTAL_ORDER_VALUE', 'EXCLUDING_TAX_SHIPPING'

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