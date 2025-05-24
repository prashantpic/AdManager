import { AdManager as EntitiesAdManager } from '../entities/promoted-listing-bid.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace InPlatformAdsBilling {
          export namespace Domain {
            export namespace Repositories {
              export interface IPromotedListingBidRepository {
                save(
                  bid: EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingBid,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Domain.Entities.PromotedListingBid>;
              }
            }
          }
        }
      }
    }
  }
}