import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { AdManager as EntitiesAdManager } from '../entities/promoted-listing-config.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Domain {
            export namespace Repositories {
              export interface IPromotedListingConfigRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingConfig | null>;
                findAll(
                  query: CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginationQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingConfig>>;
                save(
                  config: EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingConfig,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingConfig>;
              }
            }
          }
        }
      }
    }
  }
}