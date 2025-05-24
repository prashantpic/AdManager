import { AdManager as EntitiesAdManager } from '../entities/partnership-revenue-entry.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Domain {
            export namespace Repositories {
              export interface IPartnershipRevenueEntryRepository {
                save(
                  entry: EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.PartnershipRevenueEntry,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.PartnershipRevenueEntry>;
              }
            }
          }
        }
      }
    }
  }
}