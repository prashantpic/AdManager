import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { AdManager as EntitiesAdManager } from '../entities/developer-payout.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Domain {
            export namespace Repositories {
              export interface IDeveloperPayoutRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.DeveloperPayout | null>;
                findByDeveloperId(
                  developerId: string,
                  query: CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginationQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.DeveloperPayout>>;
                save(
                  payout: EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.DeveloperPayout,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.DeveloperPayout>;
              }
            }
          }
        }
      }
    }
  }
}