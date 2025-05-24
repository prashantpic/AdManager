import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { AdManager as EntitiesAdManager } from '../entities/promoted-listing-charge.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Domain {
            export namespace Repositories {
              export interface IPromotedListingChargeRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingCharge | null>;
                findByMerchantId(
                  merchantId: string,
                  query: CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginationQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingCharge>>;
                save(
                  charge: EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingCharge,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingCharge>;
              }
            }
          }
        }
      }
    }
  }
}