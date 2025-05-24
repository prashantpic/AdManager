import { AdManager as EntitiesAdManager } from '../entities/managed-service-revenue-entry.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Domain {
            export namespace Repositories {
              export interface IManagedServiceRevenueEntryRepository {
                save(
                  entry: EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.ManagedServiceRevenueEntry,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.ManagedServiceRevenueEntry>;
              }
            }
          }
        }
      }
    }
  }
}