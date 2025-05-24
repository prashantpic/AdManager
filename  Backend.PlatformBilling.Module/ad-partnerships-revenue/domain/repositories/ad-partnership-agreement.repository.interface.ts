import { AdManager as EntitiesAdManager } from '../entities/ad-partnership-agreement.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace AdPartnershipsRevenue {
          export namespace Domain {
            export namespace Repositories {
              export interface IAdPartnershipAgreementRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.AdPartnershipAgreement | null>;
                save(
                  agreement: EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.AdPartnershipAgreement,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Domain.Entities.AdPartnershipAgreement>;
              }
            }
          }
        }
      }
    }
  }
}