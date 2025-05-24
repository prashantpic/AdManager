import {
  IsBoolean,
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
              export class UpdateManagedServiceDto {
                @IsString()
                @IsNotEmpty()
                @MaxLength(255)
                @IsOptional()
                serviceName?: string;

                @IsString()
                @IsNotEmpty()
                @IsOptional()
                description?: string;

                @IsString()
                @IsNotEmpty()
                @IsOptional()
                terms?: string;

                @IsObject()
                @IsOptional()
                pricingModel?: object;

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