import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Application {
            export namespace Dto {
              export class SubmitTransactionFeeDisputeDto {
                @IsUUID('4')
                @IsNotEmpty()
                appliedFeeId: string;

                @IsString()
                @IsNotEmpty()
                @MaxLength(1000)
                reason: string;

                @IsArray()
                @IsUrl({}, { each: true })
                @IsOptional()
                supportingEvidenceUrls?: string[];
              }
            }
          }
        }
      }
    }
  }
}