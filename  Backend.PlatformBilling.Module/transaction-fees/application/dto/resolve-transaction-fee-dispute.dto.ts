import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Application {
            export namespace Dto {
              export class ResolveTransactionFeeDisputeDto {
                @IsEnum(DisputeStatus)
                // Must be one of the resolved statuses like RESOLVED_APPROVED, RESOLVED_REJECTED.
                resolutionStatus: DisputeStatus;

                @IsString()
                @IsNotEmpty()
                @MaxLength(2000)
                adminNotes: string;

                @IsNumber()
                @IsOptional()
                @Min(0)
                // Positive value for refund/credit to merchant.
                adjustmentAmount?: number;
              }
            }
          }
        }
      }
    }
  }
}