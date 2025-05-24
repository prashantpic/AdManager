import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { CommissionStatus } from '../../../common/enums/commission-status.enum';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Application {
            export namespace Dto {
              export class CommissionQueryDto extends CommonDtoAdManager.Platform
                .Backend.PlatformBilling.Common.Dto.PaginationQueryDto {
                @IsEnum(CommissionStatus)
                @IsOptional()
                status?: CommissionStatus;

                @IsUUID('4')
                @IsOptional()
                appId?: string;

                @IsDateString()
                @IsOptional()
                dateFrom?: Date;

                @IsDateString()
                @IsOptional()
                dateTo?: Date;
              }
            }
          }
        }
      }
    }
  }
}