import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { AdManager as EntitiesAdManager } from '../entities/app-commission-config.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AppDeveloperCommissions {
          export namespace Domain {
            export namespace Repositories {
              export interface IAppCommissionConfigRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.AppCommissionConfig | null>;
                findAll(
                  query: CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginationQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.AppCommissionConfig>>;
                save(
                  config: EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.AppCommissionConfig,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.AppCommissionConfig>;
                findActiveConfigForAppOrDeveloper(
                  appId: string | null, // Can be null
                  developerId: string | null, // Can be null
                  currency: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Domain.Entities.AppCommissionConfig | null>;
              }
            }
          }
        }
      }
    }
  }
}