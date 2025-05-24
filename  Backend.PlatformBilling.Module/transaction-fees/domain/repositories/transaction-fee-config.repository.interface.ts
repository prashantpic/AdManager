import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { AdManager as EntitiesAdManager } from '../entities/transaction-fee-config.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Domain {
            export namespace Repositories {
              export interface ITransactionFeeConfigRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeConfig | null>;
                findAll(
                  query: CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginationQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeConfig>>;
                save(
                  config: EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeConfig,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeConfig>;
                findActiveBySubscriptionPlanAndCurrency(
                  subscriptionPlanId: string,
                  currency: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeConfig | null>;
              }
            }
          }
        }
      }
    }
  }
}