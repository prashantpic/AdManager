import {
  IsNotEmpty,
  IsObject,
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
              export class CreateManagedServiceDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(255)
                serviceName: string;

                @IsString()
                @IsNotEmpty()
                description: string;

                @IsString()
                @IsNotEmpty()
                terms: string;

                @IsObject()
                pricingModel: object; // JSON object describing how the managed service is priced for merchants.
              }
            }
          }
        }
      }
    }
  }
}