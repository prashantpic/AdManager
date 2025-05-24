import { AdManager as EntitiesAdManager } from '../entities/managed-ad-service-offering.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Domain {
            export namespace Repositories {
              export interface IManagedAdServiceOfferingRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.ManagedAdServiceOffering | null>;
                save(
                  offering: EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.ManagedAdServiceOffering,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.ManagedAdServiceOffering>;
              }
            }
          }
        }
      }
    }
  }
}