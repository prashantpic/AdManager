import { AdManager as CommonDtoAdManager } from '../../../common/dto/pagination-query.dto';
import { AdManager as EntitiesAdManager } from '../entities/transaction-fee-dispute.entity';

export namespace AdManager {
  export namespace Platform {
    export namespace Backend {
      export namespace PlatformBilling {
        export namespace TransactionFees {
          export namespace Domain {
            export namespace Repositories {
              export interface ITransactionFeeDisputeRepository {
                findById(
                  id: string,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeDispute | null>;
                findByMerchantId(
                  merchantId: string,
                  query: CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginationQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeDispute>>;
                findAllAdmin(
                  query: CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginationQueryDto,
                ): Promise<CommonDtoAdManager.Platform.Backend.PlatformBilling.Common.Dto.PaginatedResponseDto<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeDispute>>;
                save(
                  dispute: EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeDispute,
                ): Promise<EntitiesAdManager.Platform.Backend.PlatformBilling.TransactionFees.Domain.Entities.TransactionFeeDispute>;
              }
            }
          }
        }
      }
    }
  }
}