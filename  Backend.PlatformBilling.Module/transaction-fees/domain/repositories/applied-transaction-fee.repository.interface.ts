import { AdManager as EntitiesAdManager } from '../entities/applied-transaction-fee.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Domain {
            export namespace Repositories {
              export interface IAppliedTransactionFeeRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.AppliedTransactionFee | null>;
                save(
                  appliedFee: EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.AppliedTransactionFee,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.AppliedTransactionFee>;
                findUncollectedByMerchant(
                  merchantId: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.AppliedTransactionFee[]>;
              }
            }
          }
        }
      }
    }
  }
}